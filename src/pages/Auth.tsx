import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authService, University } from "@/services/auth.service";
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
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";

interface PasswordValidation {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export default function Auth() {
  const navigate = useNavigate();
  const { login: contextLogin, register: contextRegister, isAuthenticated, user } = useAuth();
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
  const [registerUniversityName, setRegisterUniversityName] = useState("");
  const [registerHomeDistrict, setRegisterHomeDistrict] = useState("");
  const [registerCurrentResidence, setRegisterCurrentResidence] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [universityLoadError, setUniversityLoadError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === 'admin' ? '/central-admin' : '/dashboard');
    }
  }, [isAuthenticated, navigate, user?.role]);

  useEffect(() => {
    authService.getUniversities()
      .then(setUniversities)
      .catch((err: unknown) => {
        setUniversityLoadError(err instanceof Error ? err.message : "Could not load the university list.");
      });
  }, []);

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
      toast.success("Welcome back");
      setLoginEmail("");
      setLoginPassword("");
      navigate(authService.getCurrentUser()?.role === 'admin' ? "/central-admin" : "/dashboard");
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
    if (
      !registerName.trim() ||
      !registerEmail.trim() ||
      !registerPassword.trim() ||
      !registerPhone.trim() ||
      !registerDepartment ||
      !registerUniversityName.trim() ||
      !registerHomeDistrict.trim() ||
      !registerCurrentResidence.trim()
    ) {
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
        universityName: registerUniversityName,
        homeDistrict: registerHomeDistrict,
        currentResidence: registerCurrentResidence,
      });
      toast.success("Account created successfully! 🎉");
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      setRegisterPhone("");
      setRegisterDepartment("");
      setRegisterUniversityName("");
      setRegisterHomeDistrict("");
      setRegisterCurrentResidence("");
      setActiveTab("login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(registerPassword);
  const isPasswordValid = Object.values(passwordValidation).every(v => v);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="relative w-full max-w-4xl">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="brand-mark flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold">C</span>
          <span>
            <span className="block text-left text-xl font-semibold text-foreground">CSB 2.0</span>
            <span className="block text-left text-sm text-muted-foreground">Campus services</span>
          </span>
        </Link>

        <div className="mx-auto max-w-2xl">
          <Card className="overflow-hidden rounded-[26px]">
              <CardContent className="p-5 sm:p-8">
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
                        className="w-full"
                        size="lg"
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
                        <Label htmlFor="university-name">University *</Label>
                        <Input
                          id="university-name"
                          list="public-universities"
                          placeholder="Start typing your public university"
                          value={registerUniversityName}
                          onChange={(e) => setRegisterUniversityName(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                        <datalist id="public-universities">
                          {universities.map((university) => (
                            <option key={university.id} value={university.name} />
                          ))}
                        </datalist>
                        <p className="text-xs text-muted-foreground">
                          If your university is not listed, enter its official name.
                        </p>
                        {universityLoadError && (
                          <p role="alert" className="text-xs text-destructive">{universityLoadError}</p>
                        )}
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
                        <Label htmlFor="phone">Contact number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+880 1XXX-XXXXXX"
                          value={registerPhone}
                          onChange={(e) => setRegisterPhone(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="home-district">Home district *</Label>
                        <Input
                          id="home-district"
                          placeholder="Your home district"
                          value={registerHomeDistrict}
                          onChange={(e) => setRegisterHomeDistrict(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="current-residence">Current residence *</Label>
                        <Input
                          id="current-residence"
                          placeholder="Hall, area, or current address"
                          value={registerCurrentResidence}
                          onChange={(e) => setRegisterCurrentResidence(e.target.value)}
                          disabled={isLoading}
                          required
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
                              {passwordValidation.hasMinLength ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-destructive" />}
                              <span className={passwordValidation.hasMinLength ? "text-success" : "text-destructive"}>
                                At least 8 characters
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordValidation.hasUpperCase ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-destructive" />}
                              <span className={passwordValidation.hasUpperCase ? "text-success" : "text-destructive"}>
                                One uppercase letter
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordValidation.hasLowerCase ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-destructive" />}
                              <span className={passwordValidation.hasLowerCase ? "text-success" : "text-destructive"}>
                                One lowercase letter
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordValidation.hasNumber ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-destructive" />}
                              <span className={passwordValidation.hasNumber ? "text-success" : "text-destructive"}>
                                One number
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordValidation.hasSpecialChar ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-destructive" />}
                              <span className={passwordValidation.hasSpecialChar ? "text-success" : "text-destructive"}>
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
                        className="w-full"
                        size="lg"
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
  );
}
