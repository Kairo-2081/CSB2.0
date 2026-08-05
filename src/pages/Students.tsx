import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  User,
  Mail,
  Building2,
  GraduationCap,
  Filter
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  hall: string;
  role: "student" | "admin" | "faculty";
  year: string;
}

const roleConfig = {
  student: { label: "Student", variant: "secondary" as const },
  admin: { label: "Admin", variant: "destructive" as const },
  faculty: { label: "Faculty", variant: "info" as const },
};

const mockStudents: Student[] = [
  { id: "1", name: "Rahul Kumar", email: "rahul.k@university.edu", department: "Computer Science", hall: "Block A", role: "student", year: "3rd Year" },
  { id: "2", name: "Priya Sharma", email: "priya.s@university.edu", department: "Electronics", hall: "Block B", role: "student", year: "2nd Year" },
  { id: "3", name: "Dr. Amit Singh", email: "amit.singh@university.edu", department: "Computer Science", hall: "-", role: "faculty", year: "-" },
  { id: "4", name: "Sneha Patel", email: "sneha.p@university.edu", department: "Mechanical", hall: "Block C", role: "student", year: "4th Year" },
  { id: "5", name: "Admin User", email: "admin@university.edu", department: "Administration", hall: "-", role: "admin", year: "-" },
  { id: "6", name: "Vikram Joshi", email: "vikram.j@university.edu", department: "Civil", hall: "Block A", role: "student", year: "1st Year" },
  { id: "7", name: "Dr. Neha Gupta", email: "neha.g@university.edu", department: "Electronics", hall: "-", role: "faculty", year: "-" },
  { id: "8", name: "Rohan Mehta", email: "rohan.m@university.edu", department: "Computer Science", hall: "Block B", role: "student", year: "3rd Year" },
];

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const departments = [...new Set(mockStudents.map(s => s.department))];

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || student.role === roleFilter;
    const matchesDept = deptFilter === "all" || student.department === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Directory</h1>
          <p className="text-muted-foreground mt-1">Browse and search the university directory</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-4 w-4" />
                Role:
              </span>
              <Button
                variant={roleFilter === "all" ? "default" : "secondary"}
                size="sm"
                onClick={() => setRoleFilter("all")}
              >
                All
              </Button>
              {Object.entries(roleConfig).map(([key, config]) => (
                <Button
                  key={key}
                  variant={roleFilter === key ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setRoleFilter(key)}
                >
                  {config.label}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                Dept:
              </span>
              <Button
                variant={deptFilter === "all" ? "default" : "secondary"}
                size="sm"
                onClick={() => setDeptFilter("all")}
              >
                All
              </Button>
              {departments.slice(0, 3).map((dept) => (
                <Button
                  key={dept}
                  variant={deptFilter === dept ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setDeptFilter(dept)}
                >
                  {dept}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStudents.map((student, index) => {
            const role = roleConfig[student.role];
            
            return (
              <Card 
                key={student.id} 
                variant="interactive"
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{student.name}</h3>
                      </div>
                      <Badge variant={role.variant} className="mb-2 text-xs">
                        {role.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 shrink-0" />
                      {student.department}
                    </div>
                    {student.hall !== "-" && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0" />
                        {student.hall} • {student.year}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredStudents.length === 0 && (
          <Card variant="glass" className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No users found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
