import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUnifiedAuth } from "@/lib/unified-auth";
import { safeJsonResponse } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search,
  ArrowLeft,
  AlertCircle
} from "lucide-react";

interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address: string;
  medicalHistory?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function PatientManagement() {
  const { user } = useUnifiedAuth();
  const nav = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    medicalHistory: ""
  });

  useEffect(() => {
    if (!user || user.role !== "doctor") {
      nav("/login");
      return;
    }
    fetchPatients();
  }, [user, nav]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/doctor/patients', {
        headers: {
          'Authorization': `Bearer ${user?.token || user?.id}`
        }
      });

      if (response.ok) {
        try {
          const data = await response.json();
          setPatients(data);
        } catch (e) {
          console.error('Failed to parse patients data:', e);
          setError('Invalid data format received');
        }
      } else {
        setError('Failed to fetch patients');
      }
    } catch (error) {
      setError('Error loading patients');
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const patientData = {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address,
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map(item => item.trim()) : []
      };

      const response = await fetch('/api/doctor/patients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token || user?.id}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
      });

      if (response.ok) {
        setSuccess('Patient created successfully');
        resetForm();
        setIsDialogOpen(false);
        fetchPatients();
      } else {
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            setError(error.message || 'Failed to create patient');
          } else {
            setError(`Server error: ${response.status}`);
          }
        } catch (e) {
          setError('Failed to create patient');
        }
      }
    } catch (error) {
      setError('Error creating patient');
      console.error('Failed to create patient:', error);
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setError(null);
    setSuccess(null);

    try {
      const patientData = {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address,
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map(item => item.trim()) : []
      };

      const response = await fetch(`/api/doctor/patients/${selectedPatient._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token || user?.id}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
      });

      if (response.ok) {
        setSuccess('Patient updated successfully');
        resetForm();
        setIsDialogOpen(false);
        setIsEditing(false);
        setSelectedPatient(null);
        fetchPatients();
      } else {
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            setError(error.message || 'Failed to update patient');
          } else {
            setError(`Server error: ${response.status}`);
          }
        } catch (e) {
          setError('Failed to update patient');
        }
      }
    } catch (error) {
      setError('Error updating patient');
      console.error('Failed to update patient:', error);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/doctor/patients/${patientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token || user?.id}`
        }
      });

      if (response.ok) {
        setSuccess('Patient deleted successfully');
        fetchPatients();
      } else {
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            setError(error.message || 'Failed to delete patient');
          } else {
            setError(`Server error: ${response.status}`);
          }
        } catch (e) {
          setError('Failed to delete patient');
        }
      }
    } catch (error) {
      setError('Error deleting patient');
      console.error('Failed to delete patient:', error);
    }
  };

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      age: patient.age.toString(),
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email || "",
      address: patient.address,
      medicalHistory: patient.medicalHistory?.join(', ') || ""
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsEditing(false);
    setSelectedPatient(null);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
      medicalHistory: ""
    });
  };

  const filteredPatients = patients.filter(patient => {
    const name = patient.name || '';
    const phone = patient.phone || '';
    const email = patient.email || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           phone.includes(searchTerm) ||
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!user || user.role !== "doctor") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => nav("/doctor/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Patient Management</h1>
                <p className="text-sm text-muted-foreground">Manage your patient records</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {isEditing ? 'Edit Patient' : 'Add New Patient'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={isEditing ? handleUpdatePatient : handleCreatePatient} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        required
                        min="0"
                        max="150"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
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
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="medicalHistory">Medical History</Label>
                    <Textarea
                      id="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
                      placeholder="Comma-separated list of medical conditions"
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {isEditing ? 'Update Patient' : 'Add Patient'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Alerts */}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="secondary">
                {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading patients...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {searchTerm ? 'No patients match your search' : 'No patients registered yet'}
                </p>
                {!searchTerm && (
                  <Button onClick={openCreateDialog}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Your First Patient
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient._id} className="transition-colors hover:bg-muted/50 group">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                              {patient.name?.charAt(0) || '?'}
                            </div>
                            {patient.name}
                          </div>
                        </TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize text-xs font-normal">
                            {patient.gender}
                          </Badge>
                        </TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>{patient.email || 'N/A'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {patient.address}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(patient)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePatient(patient._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}