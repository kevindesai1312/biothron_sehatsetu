import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUnifiedAuth } from "@/lib/unified-auth";
import { useNavigate } from "react-router-dom";
import { Heart, Stethoscope, Users, ArrowRight } from "lucide-react";

export default function UnifiedAuth() {
  const { login, registerPatient, registerDoctor, guestLogin } = useUnifiedAuth();
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [loginRole, setLoginRole] = useState<"patient" | "doctor">("patient");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    
    try {
      await login(email, password, loginRole);
      
      // Redirect based on role
      if (loginRole === "patient") {
        nav("/patient/dashboard");
      } else if (loginRole === "doctor") {
        nav("/doctor/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  }

  async function handlePatientSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    
    if (!selectedGender) {
      setError("Please select a gender");
      return;
    }
    
    try {
      const patientData = {
        name: String(fd.get("name")),
        email: String(fd.get("email")),
        password: String(fd.get("password")),
        phone: String(fd.get("phone")),
        dateOfBirth: String(fd.get("dateOfBirth")),
        gender: selectedGender,
        address: String(fd.get("address")),
        emergencyContact: {
          name: String(fd.get("emergencyName")),
          phone: String(fd.get("emergencyPhone")),
          relationship: String(fd.get("emergencyRelationship"))
        },
        bloodGroup: selectedBloodGroup || undefined,
        medicalHistory: String(fd.get("medicalHistory")).split(',').map(item => item.trim()).filter(item => item),
        allergies: String(fd.get("allergies")).split(',').map(item => item.trim()).filter(item => item),
        currentMedications: String(fd.get("currentMedications")).split(',').map(item => item.trim()).filter(item => item)
      };
      
      await registerPatient(patientData);
      nav("/patient/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  }

  async function handleDoctorSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    
    if (!selectedSpecialization) {
      setError("Please select a specialization");
      return;
    }
    
    try {
      const doctorData = {
        username: String(fd.get("username")),
        password: String(fd.get("password")),
        name: String(fd.get("name")),
        specialization: selectedSpecialization,
        email: String(fd.get("email")),
        phone: String(fd.get("phone"))
      };
      
      await registerDoctor(doctorData);
      nav("/doctor/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  }

  function handleGuestAccess() {
    guestLogin();
    nav("/"); // Go to main dashboard as guest
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Sehat Setu</h1>
          <p className="text-muted-foreground">Choose how you'd like to access our healthcare platform</p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("patient")}>
            <CardHeader className="text-center">
              <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Patient Portal</CardTitle>
              <p className="text-sm text-muted-foreground">Book appointments, manage health records</p>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("doctor")}>
            <CardHeader className="text-center">
              <Stethoscope className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Doctor Portal</CardTitle>
              <p className="text-sm text-muted-foreground">Manage patients, appointments, slots</p>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleGuestAccess}>
            <CardHeader className="text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Guest Access</CardTitle>
              <p className="text-sm text-muted-foreground">Explore health tools, awareness content</p>
              <Button variant="outline" size="sm" className="mt-2">
                Continue as Guest <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
          </Card>
        </div>

        {/* Auth Forms */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="patient" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Patient
                </TabsTrigger>
                <TabsTrigger value="doctor" className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" /> Doctor
                </TabsTrigger>
              </TabsList>
              
              {/* Patient Tab */}
              <TabsContent value="patient">
                <Tabs defaultValue="login">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="mt-4">
                    <form className="space-y-3" onSubmit={(e) => {
                      setLoginRole("patient");
                      handleLogin(e);
                    }}>
                      <div>
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <Input 
                          name="email" 
                          type="email" 
                          required 
                          placeholder="patient@test.com"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Password</Label>
                        <Input
                          name="password"
                          type="password"
                          minLength={6}
                          required
                          placeholder="test@123"
                        />
                      </div>
                      {error && loginRole === "patient" && (
                        <div className="text-sm text-destructive">{error}</div>
                      )}
                      <Button type="submit" className="w-full">
                        Login as Patient
                      </Button>
                      <div className="text-sm text-muted-foreground text-center">
                        <p>Test credentials:</p>
                        <p>Email: patient@test.com | Password: test@123</p>
                      </div>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register" className="mt-4">
                    <form className="space-y-4" onSubmit={handlePatientSignup}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-muted-foreground">Full Name *</Label>
                          <Input name="name" required minLength={2} />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Email *</Label>
                          <Input name="email" type="email" required />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-muted-foreground">Phone *</Label>
                          <Input name="phone" type="tel" required />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Date of Birth *</Label>
                          <Input name="dateOfBirth" type="date" required />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-muted-foreground">Gender *</Label>
                          <Select value={selectedGender} onValueChange={setSelectedGender}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Blood Group</Label>
                          <Select value={selectedBloodGroup} onValueChange={setSelectedBloodGroup}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select blood group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-muted-foreground">Address *</Label>
                        <Textarea name="address" required rows={2} />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Emergency Contact *</Label>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Name</Label>
                            <Input name="emergencyName" required />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Phone</Label>
                            <Input name="emergencyPhone" type="tel" required />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Relationship</Label>
                            <Input name="emergencyRelationship" required />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-muted-foreground">Medical History</Label>
                        <Textarea 
                          name="medicalHistory" 
                          placeholder="Comma-separated list of medical conditions"
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-muted-foreground">Allergies</Label>
                          <Textarea 
                            name="allergies" 
                            placeholder="Comma-separated list"
                            rows={1}
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Current Medications</Label>
                          <Textarea 
                            name="currentMedications" 
                            placeholder="Comma-separated list"
                            rows={1}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-muted-foreground">Password *</Label>
                        <Input
                          name="password"
                          type="password"
                          minLength={6}
                          required
                        />
                      </div>
                      
                      {error && (
                        <div className="text-sm text-destructive">{error}</div>
                      )}
                      <Button type="submit" className="w-full">
                        Create Patient Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              {/* Doctor Tab */}
              <TabsContent value="doctor">
                <Tabs defaultValue="login">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="mt-4">
                    <form className="space-y-3" onSubmit={(e) => {
                      setLoginRole("doctor");
                      handleLogin(e);
                    }}>
                      <div>
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <Input 
                          name="email" 
                          type="email" 
                          required 
                          placeholder="test@gmail.com"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Password</Label>
                        <Input
                          name="password"
                          type="password"
                          minLength={6}
                          required
                          placeholder="test@123"
                        />
                      </div>
                      {error && loginRole === "doctor" && (
                        <div className="text-sm text-destructive">{error}</div>
                      )}
                      <Button type="submit" className="w-full">
                        Login as Doctor
                      </Button>
                      <div className="text-sm text-muted-foreground text-center">
                        <p>Test credentials:</p>
                        <p>Email: test@gmail.com | Password: test@123</p>
                      </div>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register" className="mt-4">
                    <form className="space-y-3" onSubmit={handleDoctorSignup}>
                      <div>
                        <Label className="text-sm text-muted-foreground">Full Name</Label>
                        <Input name="name" required minLength={2} />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Username</Label>
                        <Input name="username" required minLength={3} />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <Input name="email" type="email" required />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Phone Number</Label>
                        <Input name="phone" type="tel" required />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Specialization</Label>
                        <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select specialization" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General Medicine">General Medicine</SelectItem>
                            <SelectItem value="Cardiology">Cardiology</SelectItem>
                            <SelectItem value="Dermatology">Dermatology</SelectItem>
                            <SelectItem value="Neurology">Neurology</SelectItem>
                            <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                            <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                            <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                            <SelectItem value="Gynecology">Gynecology</SelectItem>
                            <SelectItem value="ENT">ENT</SelectItem>
                            <SelectItem value="Ophthalmology">Ophthalmology</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Password</Label>
                        <Input
                          name="password"
                          type="password"
                          minLength={6}
                          required
                        />
                      </div>
                      {error && (
                        <div className="text-sm text-destructive">{error}</div>
                      )}
                      <Button type="submit" className="w-full">
                        Register as Doctor
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}