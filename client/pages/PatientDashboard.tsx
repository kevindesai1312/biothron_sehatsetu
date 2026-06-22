import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnifiedAuth } from "@/lib/unified-auth";
import { safeJsonResponse } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { DosageCard } from "@/components/ui/DosageCard";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { 
  Heart, 
  Calendar, 
  User,
  Mail,
  Phone,
  MapPin,
  LogOut,
  Stethoscope,
  Clock,
  AlertTriangle
} from "lucide-react";

interface Appointment {
  _id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string;
  doctorId: {
    name: string;
    specialization: string;
  };
}

export default function PatientDashboard() {
  const { user, logout } = useUnifiedAuth();
  const nav = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "patient") {
      nav("/login");
      return;
    }
    fetchAppointments();
  }, [user, nav]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patient/appointments', {
        headers: {
          'Authorization': `Bearer ${user?.token || user?.id}` // Using user ID as token for demo
        }
      });

      if (response.ok) {
        try {
          const data = await response.json();
          setAppointments(data);
        } catch (e) {
          console.error('Failed to parse appointments data:', e);
        }
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.appointmentDate) >= new Date()
  ).slice(0, 3);

  if (!user || user.role !== "patient") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-semibold">Patient Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.profile?.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{user.profile?.address || 'Not provided'}</span>
              </div>
              {user.profile?.bloodGroup && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{user.profile.bloodGroup}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
              <p className="text-sm text-muted-foreground">Total appointments</p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Scheduled:</span>
                  <span className="font-medium">
                    {appointments.filter(a => a.status === 'scheduled').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Completed:</span>
                  <span className="font-medium">
                    {appointments.filter(a => a.status === 'completed').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => nav("/patient/book-appointment")}
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => nav("/patient/appointments")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Appointments
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => nav("/patient/profile")}
              >
                <User className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading appointments...</p>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No upcoming appointments</p>
                  <Button onClick={() => nav("/patient/book-appointment")}>
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Book Your First Appointment
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div 
                      key={appointment._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{appointment.doctorId.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {appointment.doctorId.specialization}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Reason: {appointment.reason}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  ))}
                  {appointments.length > 3 && (
                    <div className="text-center pt-3">
                      <Button 
                        variant="outline" 
                        onClick={() => nav("/patient/appointments")}
                      >
                        View All Appointments
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Health Summary */}
        {(user.profile?.medicalHistory?.length || user.profile?.allergies?.length || user.profile?.currentMedications?.length) && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Health Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.profile?.medicalHistory && user.profile.medicalHistory.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Medical History</h4>
                    <div className="flex flex-wrap gap-1">
                      {user.profile.medicalHistory.map((condition, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {user.profile?.allergies && user.profile.allergies.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Allergies</h4>
                    <div className="flex flex-wrap gap-1">
                      {user.profile.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {user.profile?.currentMedications && user.profile.currentMedications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Current Medications</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {user.profile.currentMedications.map((medication: any, index: number) => (
                        <div key={index} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border shadow-sm">
                          <p className="font-semibold text-sm">{typeof medication === 'string' ? medication : medication.name}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {medication.morning && <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Morning</Badge>}
                            {medication.afternoon && <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Afternoon</Badge>}
                            {medication.night && <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Night</Badge>}
                            {(!medication.morning && !medication.afternoon && !medication.night) && (
                              <span className="text-xs text-muted-foreground">No specific time provided</span>
                            )}
                          </div>
                          {medication.duration && <p className="text-xs text-muted-foreground mt-1">Duration: {medication.duration}</p>}
                          {medication.instructions && <p className="text-xs text-muted-foreground mt-1">Note: {medication.instructions}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload Lab Reports */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lab Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUpload />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}