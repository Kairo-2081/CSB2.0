import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/http";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionTitle } from "@/components/editorial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [passwords, setPasswords] = useState({ old: "", next: "", confirm: "" });
  const [changing, setChanging] = useState(false);

  if (!user) return null;

  const details: [string, string | undefined][] = [
    ["Email", user.email],
    ["Department", user.department],
    ["University", user.universityName],
    ["Phone", user.phone],
    ["Home district", user.homeDistrict],
    ["Current residence", user.currentResidence],
  ];

  const visibility: [string, string][] = [
    [
      "Student directory",
      user.showContact
        ? "Your name, department and role, plus your phone and email, to signed-in students at your university."
        : "Your name, department and role, to signed-in students at your university. Not your phone or email.",
    ],
    ["Your posts", "Your account name. Complaints and faculty suggestions can be posted anonymously."],
    ["Listings you add", "The phone number you type into a listing, so buyers, finders or borrowers can call you."],
    ["Blood donation", "Your name, blood group, location and phone, only after you agree when you list yourself."],
  ];

  const toggleContact = async (showContact: boolean) => {
    setSavingContact(true);
    try {
      setUser(await authService.updateProfile(user.id, { showContact }));
      toast.success(showContact ? "Your phone and email now show in the directory" : "Your phone and email are hidden");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your profile");
    } finally {
      setSavingContact(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      toast.error("The new passwords do not match");
      return;
    }
    setChanging(true);
    try {
      toast.success(await authService.changePassword(passwords.old, passwords.next));
      setPasswords({ old: "", next: "", confirm: "" });
      setUser({ ...user, mustChangePassword: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change your password");
    } finally {
      setChanging(false);
    }
  };

  const downloadData = async () => {
    try {
      const data = await api("/account/export");
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "csb2-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not download your data");
    }
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Delete your account and everything you posted? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await api<{ message: string }>("/account", { method: "DELETE", body: { password: deletePassword } });
      toast.success(res.message);
      logout();
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete your account");
      setDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageHeader
          photo={{ src: "/campus/bands/buet-tower.webp", alt: "A tall white BUET building with horizontal bands of windows" }}
          eyebrow={user.role === "admin" ? "Account · Admin" : "Account · Student"}
          title={`${user.name}.`}
          accent={user.department || user.universityName || undefined}
          description="Your details, and where they appear on CSB 2.0."
        />

        {user.mustChangePassword && (
          <p role="alert" className="mb-10 rounded-md border border-warning/40 bg-warning/10 px-5 py-4 text-[15px]">
            This account was created with a temporary password. Choose your own password below before you do anything else.
          </p>
        )}

        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section aria-labelledby="details">
            <SectionTitle id="details">Details</SectionTitle>
            <dl className="divide-y divide-foreground/[0.07] border-b border-foreground/[0.07]">
              {details.map(([label, value]) => (
                <div key={label} className="grid gap-1 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
                  <dt className="pt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
                  <dd className={value ? "text-[15px]" : "text-[15px] text-muted-foreground"}>{value || "Not provided"}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex items-start justify-between gap-6 border-b border-foreground/[0.07] pb-8">
              <div>
                <label data-plain htmlFor="show-contact" className="text-[15px]">
                  Show my phone and email in the student directory
                </label>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                  Off by default. Only signed-in students at your university can see the directory.
                </p>
              </div>
              <Switch
                id="show-contact"
                checked={Boolean(user.showContact)}
                onCheckedChange={toggleContact}
                disabled={savingContact}
              />
            </div>
          </section>

          <section aria-labelledby="visibility">
            <SectionTitle id="visibility">Who sees what</SectionTitle>
            <dl className="divide-y divide-foreground/[0.07]">
              {visibility.map(([title, text]) => (
                <div key={title} className="py-5">
                  <dt className="text-[15px]">{title}</dt>
                  <dd className="mt-1 text-[13px] leading-5 text-muted-foreground">{text}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <section aria-labelledby="password" className="mt-16 max-w-xl">
          <SectionTitle id="password">Change password</SectionTitle>
          <form onSubmit={changePassword} className="flex flex-col gap-4">
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Current password"
              aria-label="Current password"
              value={passwords.old}
              onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
              required
            />
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              aria-label="New password"
              value={passwords.next}
              onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
              required
            />
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Repeat the new password"
              aria-label="Repeat the new password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              required
            />
            <p className="text-[13px] leading-5 text-muted-foreground">
              At least 8 characters with upper and lower case, a number and a symbol. Changing it signs you out on every other device.
            </p>
            <div>
              <Button type="submit" disabled={changing}>
                {changing ? "Changing…" : "Change password"}
              </Button>
            </div>
          </form>
        </section>

        <section aria-labelledby="your-data" className="mt-16 grid max-w-4xl gap-10 border-t border-foreground/[0.07] pt-12 md:grid-cols-2">
          <div>
            <SectionTitle id="your-data">Your data</SectionTitle>
            <p className="text-[14px] leading-6 text-muted-foreground">
              A JSON file with your account, everything you posted, your lending, the reports you made and your sign-in sessions.
            </p>
            <Button type="button" variant="outline" className="mt-4" onClick={downloadData}>Download my data</Button>
          </div>
          <form onSubmit={deleteAccount}>
            <h3 className="font-display text-2xl">Delete account</h3>
            <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
              Deletes your account and everything you posted, straight away. Encrypted backups age out within 30 days.
            </p>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              aria-label="Password to confirm deletion"
              className="mt-4"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
            />
            <Button type="submit" variant="destructive" className="mt-3" disabled={deleting || !deletePassword}>
              {deleting ? "Deleting…" : "Delete my account"}
            </Button>
          </form>
        </section>
      </div>
    </MainLayout>
  );
}
