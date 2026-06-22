import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUnifiedAuth } from "@/lib/unified-auth";
import { safeJsonResponse } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User,
  Stethoscope,
  CheckCircle
} from "lucide-react";

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
}

interface Slot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  status: string;
}

export default function PatientBookAppointment() {
  const { user } = useUnifiedAuth();
  const nav = useNavigate();
  const { toast } = useToast();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [doctorsLoading, setDoctorsLoading] = useState<boolean>(true);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!user || user.role !== "patient") {
      nav("/login");
      return;
    }
    fetchDoctors();
  }, [user, nav]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSelectedSlot("");
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      setDoctorsLoading(true);
      const response = await fetch('/api/patient/doctors', {
        headers: {
          'Authorization': `Bearer ${user?.token || user?.id}`
        }
      });

      if (response.ok) {
        try {
          const data = await response.json();
          setDoctors(data);
        } catch (e) {
          console.error('Failed to parse doctors data:', e);
          toast({
            title: "Error",
            description: "Invalid data format received",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load doctors",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive"
      });
    } finally {
      setDoctorsLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setSlotsLoading(true);
      const response = await fetch(`/api/patient/doctors/${selectedDoctor}/slots?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${user?.token || user?.id}`
        }
      });

      if (response.ok) {
        try {
          const data = await response.json();
          setAvailableSlots(data);
        } catch (e) {
          console.error('Failed to parse slots data:', e);
          toast({
            title: "Error",
            description: "Invalid data format received",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load available slots",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available slots",
        variant: "destructive"
      });
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !reason.trim()) {
      toast({
        title: "Error",
        description: "Please select a slot and provide a reason for the appointment",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/patient/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || user?.id}`
        },
        body: JSON.stringify({
          slotId: selectedSlot,
          reason: reason.trim(),
          notes: notes.trim()
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Appointment booked successfully!",
        });
        nav("/patient/appointments");
      } else {
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            toast({
              title: "Error",
              description: error.message || "Failed to book appointment",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Error",
              description: `Server error: ${response.status}`,
              variant: "destructive"
            });
          }
        } catch (e) {
          toast({
            title: "Error",
            description: "Failed to book appointment",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Failed to book appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedDoctorInfo = doctors.find(doc => doc._id === selectedDoctor);
  const selectedSlotInfo = availableSlots.find(slot => slot._id === selectedSlot);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  if (!user || user.role !== "patient") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => nav("/patient/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Stethoscope className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Book Appointment</h1>
              <p className="text-sm text-muted-foreground">Schedule a consultation with a doctor</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Step 1: Select Doctor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Step 1: Select Doctor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {doctorsLoading ? (
                <p className="text-sm text-muted-foreground">Loading doctors...</p>
              ) : (
                <div className="space-y-4">
                  <Label>Choose a doctor</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor._id} value={doctor._id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{doctor.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {doctor.specialization}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedDoctorInfo && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-medium">{selectedDoctorInfo.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Specialization: {selectedDoctorInfo.specialization}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Email: {selectedDoctorInfo.email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Phone: {selectedDoctorInfo.phone}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Step 2: Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Choose appointment date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                  disabled={!selectedDoctor}
                />
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Select Time Slot */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Step 3: Select Time Slot
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDoctor || !selectedDate ? (
                <p className="text-sm text-muted-foreground">
                  Please select a doctor and date first
                </p>
              ) : slotsLoading ? (
                <p className="text-sm text-muted-foreground">Loading available slots...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No available slots for this date. Please try another date.
                </p>
              ) : (
                <div className="space-y-4">
                  <Label>Available time slots</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot._id}
                        variant={selectedSlot === slot._id ? "default" : "outline"}
                        className="h-auto py-3"
                        onClick={() => setSelectedSlot(slot._id)}
                      >
                        <div className="text-center">
                          <div className="font-medium">{slot.startTime}</div>
                          <div className="text-xs opacity-75">to {slot.endTime}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 4: Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Appointment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">Reason for Visit *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g., Regular checkup, fever, consultation"
                      maxLength={200}
                    />
                    <VoiceInput onResult={(text) => setReason((prev) => prev ? `${prev} ${text}` : text)} />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <div className="flex gap-2 items-start">
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional information you'd like to share with the doctor..."
                      rows={3}
                      maxLength={500}
                      className="flex-1"
                    />
                    <VoiceInput onResult={(text) => setNotes((prev) => prev ? `${prev} ${text}` : text)} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Summary & Book Button */}
          {selectedDoctorInfo && selectedSlotInfo && reason.trim() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Appointment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Doctor:</span>
                    <span className="font-medium">{selectedDoctorInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Specialization:</span>
                    <Badge variant="outline">{selectedDoctorInfo.specialization}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">
                      {new Date(selectedDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">
                      {selectedSlotInfo.startTime} - {selectedSlotInfo.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason:</span>
                    <span className="font-medium">{reason}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6" 
                  onClick={handleBookAppointment}
                  disabled={loading}
                >
                  {loading ? "Booking..." : "Book Appointment"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}