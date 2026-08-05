import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mail, 
  Lock, 
  User,
  Shield,
  GraduationCap,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";

// Demo credentials for testing
const DEMO_CREDENTIALS = {
  admin: {
    name: 'Admin User',
    email: 'admin@campushub.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Administration',
  },
  students: [
    {
      name: 'Raj Kumar',
      email: 'raj@student.com',
      password: 'Student@123',
      role: 'student',
      department: 'Computer Science',
    },
    {
      name: 'Priya Singh',
      email: 'priya@student.com',
      password: 'Student@123',
      role: 'student',
      department: 'Engineering',
    },
    {
      name: 'Amit Patel',
      email: 'amit@student.com',
      password: 'Student@123',
      role: 'student',
      department: 'Business',
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah@student.com',
      password: 'Student@123',
      role: 'student',
      department: 'Medical',
    },
    {
      name: 'Michael Chen',
      email: 'michael@student.com',
      password: 'Student@123',
      role: 'student',
      department: 'Science',
    },
  ]
};

interface PasswordValidation {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export default function Auth() {
  const navigate = useNavigate();
  const { login: contextLogin, register: contextRegister, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerDepartment, setRegisterDepartment] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validatePassword = (password: string): PasswordValidation => {
    return {
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
    };
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(loginEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await contextLogin(loginEmail, loginPassword);
      toast.success(`Welcome back! 👋`);
      setLoginEmail("");
      setLoginPassword("");
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim() || !registerDepartment) {
      setError("Please fill in all required fields");
      return;
    }

    if (!validateEmail(registerEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    const passwordValidation = validatePassword(registerPassword);
    if (!Object.values(passwordValidation).every(v => v)) {
      setError("Password does not meet security requirements");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await contextRegister({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        phone: registerPhone,
        department: registerDepartment,
      });
      toast.success("Account created successfully! 🎉");
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      setRegisterPhone("");
      setRegisterDepartment("");
      setActiveTab("login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (email: string, password: string, name: string) => {
    setError("");
    setIsLoading(true);
    try {
      await contextLogin(email, password);
      toast.success(`Welcome, ${name}! 🎓`);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Quick login failed";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(registerPassword);
  const isPasswordValid = Object.values(passwordValidation).every(v => v);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-4xl relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-xl shadow-lg">
              C
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-foreground">Campus Hub</h1>
              <p className="text-sm text-muted-foreground">University Management System</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Demo Credentials - Left Side */}
          <div className="md:col-span-1 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Demo Accounts</h2>
              <p className="text-xs text-muted-foreground">Quick access for testing</p>
            </div>

            {/* Admin Demo Card */}
            <Card className="border-red-200 dark:border-red-900/30 bg-gradient-to-br from-red-50 to-red-50/50 dark:from-red-950/20 dark:to-red-950/10">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  <CardTitle className="text-sm text-red-900 dark:text-red-200">Admin</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="bg-white dark:bg-slate-900 p-2 rounded text-xs">
                  <p className="font-mono text-foreground break-all">admin@campushub.com</p>
                  <p className="text-muted-foreground text-xs mt-1">Admin@123</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => quickLogin('admin@campushub.com', 'Admin@123', 'Admin User')}
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 h-8"
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Login"}
                </Button>
              </CardContent>
            </Card>

            {/* Students Demo Cards */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                Students
              </h3>
              <div className="space-y-2">
                {DEMO_CREDENTIALS.students.slice(0, 3).map((user, idx) => (
                  <Card key={idx} className="border-blue-200 dark:border-blue-900/30">
                    <CardContent className="p-2">
                      <p className="text-xs font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
                      <Button
                        size="sm"
                        onClick={() => quickLogin(user.email, user.password, user.name)}
                        disabled={isLoading}
                        className="w-full mt-2 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Login"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Login/Register Form - Right Side */}
          <div className="md:col-span-2">
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login" className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@university.edu"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="pl-10 pr-10"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Register Tab */}
                  <TabsContent value="register" className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@university.edu"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department">Department *</Label>
                        <select
                          id="department"
                          value={registerDepartment}
                          onChange={(e) => setRegisterDepartment(e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50"
                          disabled={isLoading}
                        >
                          <option value="">Select a department</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Business">Business</option>
                          <option value="Medical">Medical</option>
                          <option value="Science">Science</option>
                          <option value="Arts">Arts</option>
                          <option value="Law">Law</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (Optional)</Label>
                        <Input
                          id="phone"
                          placeholder="+91 98765 43210"
                          value={registerPhone}
                          onChange={(e) => setRegisterPhone(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="reg-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            className="pl-10 pr-10"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {registerPassword && (
                        <div className="space-y-2 text-xs">
                          <p className="font-medium text-foreground mb-2">Password Strength:</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {passwordValidation.hasMinLength ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                              <span className={passwordValidation.hasMinLength ? "text-green-600" : "text-red-600"}>
                                At least 8 characters
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordValidation.hasUpperCase ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                              <span className={passwordValidation.hasUpperCase ? "text-green-600" : "text-red-600"}>
                                One uppercase letter
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordValidation.hasLowerCase ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                              <span className={passwordValidation.hasLowerCase ? "text-green-600" : "text-red-600"}>
                                One lowercase letter
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordValidation.hasNumber ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                              <span className={passwordValidation.hasNumber ? "text-green-600" : "text-red-600"}>
                                One number
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordValidation.hasSpecialChar ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                              <span className={passwordValidation.hasSpecialChar ? "text-green-600" : "text-red-600"}>
                                One special character (@$!%*?&)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={registerConfirmPassword}
                            onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                            className="pl-10 pr-10"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {registerConfirmPassword && registerPassword !== registerConfirmPassword && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>Passwords do not match</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={isLoading || !isPasswordValid || registerPassword !== registerConfirmPassword}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        By registering, you agree to our Terms of Service
                      </p>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
