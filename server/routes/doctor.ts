import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Doctor, Patient, Slot, IDoctor } from '../models/doctor';
import { PatientAppointment } from '../models/patient';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify doctor token
const verifyToken = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const doctor = await Doctor.findById(decoded.id);
    if (!doctor) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.doctor = doctor;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Doctor Authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if it's a test account
    if ((email === 'test@gmail.com' && password === 'test@123') || 
        (email === 'doc@gmail.com' && password === 'doc@123')) {
      
      let doctor = await Doctor.findOne({ email });
      
      // Create test account if it doesn't exist
      if (!doctor) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const testAccountData = email === 'test@gmail.com' ? {
          username: 'testdoctor',
          password: hashedPassword,
          name: 'Test Doctor',
          specialization: 'General Medicine',
          email: 'test@gmail.com',
          phone: '1234567890'
        } : {
          username: 'docuser',
          password: hashedPassword,
          name: 'Dr. Smith',
          specialization: 'Cardiology',
          email: 'doc@gmail.com',
          phone: '9876543210'
        };
        
        doctor = await Doctor.create(testAccountData);
      }

      const token = jwt.sign({ id: doctor._id }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token, doctor: { ...doctor.toObject(), password: undefined } });
    }

    // Find doctor by email instead of username
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, doctor.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: doctor._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, doctor: { ...doctor.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Doctor Registration
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, specialization, email, phone } = req.body;

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ 
      $or: [{ email }, { username }] 
    });
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor already exists with this email or username' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new doctor
    const doctor = await Doctor.create({
      username,
      password: hashedPassword,
      name,
      specialization,
      email,
      phone
    });

    const token = jwt.sign({ id: doctor._id }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, doctor: { ...doctor.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Doctor Profile Update
router.put('/profile', verifyToken, async (req: any, res) => {
  try {
    const { name, phone, specialization } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.doctor._id,
      { name, phone, specialization },
      { new: true, runValidators: true }
    );
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json({ message: 'Profile updated successfully', doctor: { ...doctor.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Patient Management
router.get('/patients', verifyToken, async (req: any, res) => {
  try {
    const patients = await Patient.find({ doctorId: req.doctor._id });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/patients', verifyToken, async (req: any, res) => {
  try {
    const patient = await Patient.create({ ...req.body, doctorId: req.doctor._id });
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/patients/:id', verifyToken, async (req: any, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.doctor._id },
      req.body,
      { new: true }
    );
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/patients/:id', verifyToken, async (req: any, res) => {
  try {
    const patient = await Patient.findOneAndDelete({
      _id: req.params.id,
      doctorId: req.doctor._id
    });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Slot Management
router.get('/slots', verifyToken, async (req: any, res) => {
  try {
    const slots = await Slot.find({ doctorId: req.doctor._id })
      .populate('patientId', 'name')
      .sort({ date: 1, startTime: 1 });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/slots', verifyToken, async (req: any, res) => {
  try {
    const slot = await Slot.create({ ...req.body, doctorId: req.doctor._id });
    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/slots/:id', verifyToken, async (req: any, res) => {
  try {
    const slot = await Slot.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.doctor._id },
      req.body,
      { new: true }
    );
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Integrate PatientAppointment status changes
    if (slot.status === 'cancelled' || slot.status === 'available') {
      await PatientAppointment.updateMany(
        { slotId: slot._id, status: { $in: ['scheduled'] } },
        { status: 'cancelled' }
      );
    } else if (slot.status === 'completed') {
      await PatientAppointment.updateMany(
        { slotId: slot._id, status: { $in: ['scheduled'] } },
        { status: 'completed' }
      );
    }

    res.json(slot);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/slots/:id', verifyToken, async (req: any, res) => {
  try {
    const slot = await Slot.findOneAndDelete({
      _id: req.params.id,
      doctorId: req.doctor._id
    });
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Cancel any connected appointments
    await PatientAppointment.updateMany(
      { slotId: req.params.id, status: { $in: ['scheduled'] } },
      { status: 'cancelled', notes: 'Slot was deleted by the doctor' }
    );

    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Patient Appointments Management
router.get('/appointments', verifyToken, async (req: any, res) => {
  try {
    const appointments = await PatientAppointment.find({ doctorId: req.doctor._id })
      .populate('patientId', 'name email phone age gender bloodGroup address')
      .populate('slotId')
      .sort({ appointmentDate: -1, startTime: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/appointments/:id', verifyToken, async (req: any, res) => {
  try {
    const { status, doctorNotes, prescription, structuredPrescription } = req.body;
    const appointment = await PatientAppointment.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.doctor._id },
      { status, doctorNotes, prescription, structuredPrescription },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Integrate Slot status changes
    if (status === 'completed') {
      await Slot.findByIdAndUpdate(appointment.slotId, { status: 'completed' });
    } else if (status === 'cancelled' || status === 'no-show') {
      await Slot.findByIdAndUpdate(appointment.slotId, { 
        status: 'available', 
        isBooked: false, 
        patientId: undefined 
      });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Quick-Text Templates
let quickTextTemplates = [
  { id: '1', title: 'Basic Gastroenteritis', text: 'Drink ORS regularly. Avoid spicy food. Take Paracetamol for fever.' },
  { id: '2', title: 'Iron-Deficiency Anemia Regimen', text: 'Take 1 Iron supplement daily with food. Increase intake of green leafy vegetables.' },
  { id: '3', title: 'Common Cold', text: 'Rest. Drink warm fluids. Take antihistamine at night.' }
];

router.get('/templates', verifyToken, async (req: any, res) => {
  try {
    // In a real database, this would be fetched from a Template collection tied to the doctor ID
    res.json(quickTextTemplates);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/templates', verifyToken, async (req: any, res) => {
  try {
    const newTemplate = { id: Date.now().toString(), ...req.body };
    quickTextTemplates.push(newTemplate);
    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;