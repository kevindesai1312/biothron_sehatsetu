import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUnifiedAuth } from "@/lib/unified-auth";
import { safeJsonResponse } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  User
} from "lucide-react";

interface Patient {
  _id: string;
  name: string;
}

interface Slot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  patientId?: Patient;
  status: 'available' | 'booked' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export default function SlotManagement() {
  const { user } = useUnifiedAuth();
  const nav = useNavigate();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    status: "available",
    patientId: ""
  });

  useEffect(() => {
    if (!user || user.role !== "doctor") {
      nav("/login");
      return;
    }
    fetchData();
  }, [user, nav]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsRes, patientsRes] = await Promise.all([
        fetch('/api/doctor/slots', {
          headers: {
            'Authorization': `Bearer ${user?.token || user?.id}`
          }
        }),
        fetch('/api/doctor/patients', {
          headers: {
            'Authorization': `Bearer ${user?.token || user?.id}`
          }
        })
      ]);

      if (slotsRes.ok) {
        try {
          const slotsData = await slotsRes.json();
          setSlots(slotsData);
        } catch (e) {
          console.error('Failed to parse slots data:', e);
          setError('Invalid data format received');
        }
      }

      if (patientsRes.ok) {
        try {
          const patientsData = await patientsRes.json();
          setPatients(patientsData);
        } catch (e) {
          console.error('Failed to parse patients data:', e);
          setError('Invalid data format received');
        }
      }
    } catch (error) {
      setError('Error loading data');
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const slotData = {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: formData.status,
        patientId: formData.patientId || undefined,
        isBooked: formData.status === 'booked'
      };

      const response = await fetch('/api/doctor/slots', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token || user?.id}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(slotData)
      });

      if (response.ok) {
        setSuccess('Appointment slot created successfully');
        resetForm();
        setIsDialogOpen(false);
        fetchData();
      } else {
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            setError(error.message || 'Failed to create slot');
          } else {
            setError(`Server error: ${response.status}`);
          }
        } catch (e) {
          setError('Failed to create slot');
        }
      }
    } catch (error) {
      setError('Error creating slot');
      console.error('Failed to create slot:', error);
    }
  };

  const handleUpdateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setError(null);
    setSuccess(null);

    try {
      const slotData = {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: formData.status,
        patientId: formData.patientId || undefined,
        isBooked: formData.status === 'booked'
      };

      const response = await fetch(`/api/doctor/slots/${selectedSlot._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token || user?.id}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(slotData)
      });

      if (response.ok) {
        setSuccess('Appointment slot updated successfully');
        resetForm();
        setIsDialogOpen(false);
        setIsEditing(false);
        setSelectedSlot(null);
        fetchData();
      } else {
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            setError(error.message || 'Failed to update slot');
          } else {
            setError(`Server error: ${response.status}`);
          }
        } catch (e) {
          setError('Failed to update slot');
        }
      }
    } catch (error) {
      setError('Error updating slot');
      console.error('Failed to update slot:', error);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this appointment slot?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/doctor/slots/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token || user?.id}`
        }
      });

      if (response.ok) {
        setSuccess('Appointment slot deleted successfully');
        fetchData();
      } else {
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            setError(error.message || 'Failed to delete slot');
          } else {
            setError(`Server error: ${response.status}`);
          }
        } catch (e) {
          setError('Failed to delete slot');
        }
      }
    } catch (error) {
      setError('Error deleting slot');
      console.error('Failed to delete slot:', error);
    }
  };

  const openEditDialog = (slot: Slot) => {
    setSelectedSlot(slot);
    setFormData({
      date: slot.date.split('T')[0], // Extract date part
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      patientId: slot.patientId?._id || ""
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsEditing(false);
    setSelectedSlot(null);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      date: "",
      startTime: "",
      endTime: "",
      status: "available",
      patientId: ""
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="secondary">Available</Badge>;
      case 'booked':
        return <Badge className="bg-blue-500">Booked</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredSlots = slots.filter(slot => {
    const patientName = slot.patientId?.name || '';
    const date = slot.date || '';
    const startTime = slot.startTime || '';
    
    const matchesSearch = 
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      date.includes(searchTerm) ||
      startTime.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || slot.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
                <h1 className="text-xl font-semibold">Appointment Management</h1>
                <p className="text-sm text-muted-foreground">Manage your appointment slots</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {isEditing ? 'Edit Appointment Slot' : 'Add New Appointment Slot'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={isEditing ? handleUpdateSlot : handleCreateSlot} className="space-y-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.status === 'booked' || formData.status === 'completed') && (
                    <div>
                      <Label htmlFor="patientId">Patient</Label>
                      <Select value={formData.patientId} onValueChange={(value) => setFormData({...formData, patientId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient._id} value={patient._id}>
                              {patient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {isEditing ? 'Update Slot' : 'Add Slot'}
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
                  placeholder="Search by patient name, date, or time..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary">
                {filteredSlots.length} slot{filteredSlots.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Slots Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading appointment slots...</p>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No slots match your criteria' : 'No appointment slots created yet'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Slot
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSlots.map((slot) => (
                      <TableRow key={slot._id}>
                        <TableCell className="font-medium">
                          {new Date(slot.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const start = new Date(`2000-01-01T${slot.startTime}`);
                            const end = new Date(`2000-01-01T${slot.endTime}`);
                            const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                            return `${duration} min`;
                          })()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(slot.status)}
                        </TableCell>
                        <TableCell>
                          {slot.patientId ? (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {slot.patientId.name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No patient</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(slot.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(slot)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSlot(slot._id)}
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