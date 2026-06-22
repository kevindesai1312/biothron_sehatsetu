import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PatientUser, PatientAppointment } from '../models/patient';
import { Doctor, Slot, Patient as DoctorPatient } from '../models/doctor';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify patient token
const verifyPatientToken = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const patient = await PatientUser.findById(decoded.id);
    if (!patient) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.patient = patient;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Patient Authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if it's the test account
    if (email === 'patient@test.com' && password === 'test@123') {
      let patient = await PatientUser.findOne({ email: 'patient@test.com' });
      
      // Create test account if it doesn't exist
      if (!patient) {
        const hashedPassword = await bcrypt.hash('test@123', 10);
        patient = await PatientUser.create({
          name: 'Test Patient',
          email: 'patient@test.com',
          password: hashedPassword,
          phone: '1234567890',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: '123 Test Street, Test City',
          emergencyContact: {
            name: 'Emergency Contact',
            phone: '0987654321',
            relationship: 'Family'
          },
          bloodGroup: 'O+'
        });
      }

      const token = jwt.sign({ id: patient._id }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token, patient: { ...patient.toObject(), password: undefined } });
    }

    // Find patient by email
    const patient = await PatientUser.findOne({ email });
    if (!patient) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, patient.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: patient._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, patient: { ...patient.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Patient Registration
router.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      dateOfBirth, 
      gender, 
      address, 
      emergencyContact,
      bloodGroup,
      medicalHistory,
      allergies,
      currentMedications
    } = req.body;

    // Check if patient already exists
    const existingPatient = await PatientUser.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ message: 'Patient already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new patient
    const patient = await PatientUser.create({
      name,
      email,
      password: hashedPassword,
      phone,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      address,
      emergencyContact,
      bloodGroup,
      medicalHistory: medicalHistory || [],
      allergies: allergies || [],
      currentMedications: currentMedications || []
    });

    const token = jwt.sign({ id: patient._id }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, patient: { ...patient.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Patient Profile
router.get('/profile', verifyPatientToken, async (req: any, res) => {
  try {
    const patient = req.patient;
    res.json({ ...patient.toObject(), password: undefined });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Patient Profile
router.put('/profile', verifyPatientToken, async (req: any, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password updates through this endpoint
    delete updates.email; // Don't allow email updates through this endpoint

    const patient = await PatientUser.findByIdAndUpdate(
      req.patient._id,
      updates,
      { new: true }
    );

    res.json({ ...patient.toObject(), password: undefined });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Available Doctors
router.get('/doctors', verifyPatientToken, async (req: any, res) => {
  try {
    const doctors = await Doctor.find({}, { password: 0 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Available Slots for a Doctor
router.get('/doctors/:doctorId/slots', verifyPatientToken, async (req: any, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    let query: any = { 
      doctorId, 
      status: 'available',
      isBooked: false
    };

    if (date) {
      query.date = {
        $gte: new Date(date as string),
        $lt: new Date(new Date(date as string).getTime() + 24 * 60 * 60 * 1000)
      };
    }

    const slots = await Slot.find(query).sort({ date: 1, startTime: 1 });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Book an Appointment
router.post('/appointments', verifyPatientToken, async (req: any, res) => {
  try {
    const { slotId, reason, notes } = req.body;
    const patientId = req.patient._id;

    // Check if slot is available
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (slot.isBooked || slot.status !== 'available') {
      return res.status(400).json({ message: 'Slot is not available' });
    }

    // Find or create the doctor's Patient record for this PatientUser
    let doctorPatient = await DoctorPatient.findOne({
      doctorId: slot.doctorId,
      email: req.patient.email
    });

    if (!doctorPatient) {
      const dob = new Date(req.patient.dateOfBirth);
      const ageDate = new Date(Date.now() - dob.getTime());
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      
      doctorPatient = await DoctorPatient.create({
        name: req.patient.name,
        age: age || 0,
        gender: req.patient.gender,
        phone: req.patient.phone,
        email: req.patient.email,
        address: req.patient.address,
        medicalHistory: req.patient.medicalHistory,
        doctorId: slot.doctorId
      });
    }

    // Update slot to booked
    await Slot.findByIdAndUpdate(slotId, {
      isBooked: true,
      status: 'booked',
      patientId: doctorPatient._id
    });

    // Create appointment record
    const appointment = await PatientAppointment.create({
      patientId,
      doctorId: slot.doctorId,
      slotId,
      appointmentDate: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      reason,
      notes: notes || ''
    });

    const populatedAppointment = await PatientAppointment.findById(appointment._id)
      .populate('doctorId', 'name specialization email phone')
      .populate('slotId');

    res.status(201).json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Patient's Appointments
router.get('/appointments', verifyPatientToken, async (req: any, res) => {
  try {
    const appointments = await PatientAppointment.find({ patientId: req.patient._id })
      .populate('doctorId', 'name specialization email phone')
      .populate('slotId')
      .sort({ appointmentDate: -1, startTime: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel Appointment
router.put('/appointments/:id/cancel', verifyPatientToken, async (req: any, res) => {
  try {
    const appointment = await PatientAppointment.findOne({
      _id: req.params.id,
      patientId: req.patient._id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed appointment' });
    }

    // Update appointment status
    appointment.status = 'cancelled';
    await appointment.save();

    // Free up the slot
    await Slot.findByIdAndUpdate(appointment.slotId, {
      isBooked: false,
      status: 'available',
      patientId: undefined
    });

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Acknowledge Prescription
router.put('/appointments/:id/acknowledge', verifyPatientToken, async (req: any, res) => {
  try {
    const appointment = await PatientAppointment.findOne({
      _id: req.params.id,
      patientId: req.patient._id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.prescriptionAcknowledged = true;
    await appointment.save();

    res.json({ message: 'Prescription acknowledged successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;