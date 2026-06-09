"use client";
import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ── schema ── */
const createSchema = z.object({
    name: z.string().min(2, "Full name is required").regex(/^[A-Za-z\s'-]+$/, "Name cannot contain numbers or special characters"),
    email:       z.string().email("Valid email is required"),
    phone: z.string().optional().or(z.literal("")).refine(val => val === "" || /^\d{9,15}$/.test(val), { message: "Phone number must be between 9 and 15 digits"}),
    password:    z.string().min(6,  "Password must be at least 6 characters"),
    role:        z.string().min(1,  "Role is required"),
    employeeId:  z.string().optional(),
    department:  z.string().optional(),
    joiningDate: z.string().optional(),
});

const editSchema = z.object({
    employeeId:  z.string().optional(),
    department:  z.string().optional(),
    joiningDate: z.string().optional(),
    role:        z.string().optional(),
    status:      z.enum(["Active", "Inactive"]).optional(),
});

const STATUSES = ["Active", "Inactive"];

const DEPARTMENTS = [
    "Engineering", "Sales", "HR", "Marketing",
    "Finance", "Operations", "Design", "Management",
];

export function EmployeeForm({ defaultValues, roles = [], onSave, onCancel }) {
    const isEdit = !!defaultValues;
    const [submitError,  setSubmitError]  = useState("");
    const [imagePreview, setImagePreview] = useState(
        defaultValues?.user?.profileImage?.url ?? null
    );
    const [imageFile,    setImageFile]    = useState(null);
    const fileInputRef = useRef(null);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(isEdit ? editSchema : createSchema),
        defaultValues: isEdit? {
          employeeId: defaultValues.employeeId ?? "",
          department: defaultValues.department ?? "",
          joiningDate: defaultValues.joiningDate ? defaultValues.joiningDate.split("T")[0] : "",

          role: typeof defaultValues?.role === "object" ? defaultValues.role._id: defaultValues?.role || "",

          status: defaultValues.status ?? "Active",
        }
        : {
            name: "",
            email: "",
            phone: "",
            password: "",
            role: "",
            employeeId: "",
            department: "",
            joiningDate: "",
        },
    });

    function handleImageChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }

    function removeImage() {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    async function onSubmit(data) {
        setSubmitError("");
        try {
            // build FormData for multipart/form-data
            const fd = new FormData();
            Object.entries(data).forEach(([key, val]) => {
                if (val !== undefined && val !== "") fd.append(key, val);
            });
            if (imageFile) fd.append("profileImage", imageFile);
            await onSave(fd, isEdit);
        } catch (e) {
            setSubmitError(e.message);
        }
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-background px-8 py-6 space-y-5 max-h-[75vh] overflow-y-auto"
        >

            {/* Submit error */}
            {submitError && (
                <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                    {submitError}
                </div>
            )}

            {/* Profile Image */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold">Profile Image</Label>
                <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="w-16 h-16 rounded-2xl bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User size={24} className="text-muted-foreground" />
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-1.5 rounded-lg text-xs h-8"
                            >
                                <Upload size={13} />
                                {imagePreview ? "Change" : "Upload"}
                            </Button>
                            {imagePreview && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={removeImage}
                                    className="gap-1.5 rounded-lg text-xs h-8 text-destructive hover:text-destructive"
                                >
                                    <X size={13} />
                                    Remove
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            JPG, PNG or WebP. Max 5MB.
                        </p>
                    </div>
                </div>
            </div>

            <div className="h-px bg-border" />

            {/* Create-only fields */}
            {!isEdit && (
                <>
                    {/* Name + Email */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Full Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                {...register("name")}
                                placeholder="Rahul Sharma"
                                className={cn(
                                    "h-11 rounded-xl bg-muted/40 text-sm",
                                    errors.name && "border-destructive"
                                )}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Email <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                {...register("email")}
                                type="email"
                                placeholder="rahul@promonkey.com"
                                className={cn(
                                    "h-11 rounded-xl bg-muted/40 text-sm",
                                    errors.email && "border-destructive"
                                )}
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">{errors.email.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Phone + Password */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">Phone</Label>
                            <Input
                                {...register("phone")}
                                placeholder="9876543210"
                                className="h-11 rounded-xl bg-muted/40 text-sm"
                            />
                            {errors.phone && (
                                <p className="text-xs text-destructive">{errors.phone.message}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Password <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                {...register("password")}
                                type="password"
                                placeholder="Min 6 characters"
                                className={cn(
                                    "h-11 rounded-xl bg-muted/40 text-sm",
                                    errors.password && "border-destructive"
                                )}
                            />
                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password.message}</p>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Employee ID + Department */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Employee ID</Label>
                    <Input
                        {...register("employeeId")}
                        placeholder="EMP001"
                        className="h-11 rounded-xl bg-muted/40 text-sm"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Department</Label>
                    <Controller
                        name="department"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="h-11 rounded-xl bg-muted/40 text-sm">
                                    <SelectValue placeholder="Select department..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl bg-background">
                                    {DEPARTMENTS.map((d) => (
                                        <SelectItem key={d} value={d} className="text-sm">{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>

            {/* Role + Joining Date */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">
                        Role {!isEdit && (<span className="text-destructive">*</span>)}
                    </Label>

                    <Controller
                        name="role"
                        control={control}
                        render={({ field }) => {const selectedRole = roles.find((r) => r._id === field.value );

                            return (
                                <Select value={field.value || ""} onValueChange={(value) => field.onChange(value) }>
                                    <SelectTrigger className={cn("h-11 rounded-xl bg-muted/40 text-sm",errors.role && "border-destructive" )}
                                    >
                                        <SelectValue placeholder="Select role">
                                            {selectedRole?.name || "Select role"}
                                        </SelectValue>
                                    </SelectTrigger>

                                    <SelectContent className="rounded-xl bg-background">
                                        {roles.map((role) => (
                                            <SelectItem key={role._id} value={role._id} className="text-sm">
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            );
                        }}
                    />

                    {errors.role && (
                        <p className="text-xs text-destructive">
                            {errors.role.message}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">
                        Joining Date
                    </Label>

                    <Input
                        {...register("joiningDate")}
                        type="date"
                        className="h-11 rounded-xl bg-muted/40 text-sm"
                    />
                </div>
            </div>

            {/* Status — edit only */}
            {isEdit && (
                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Status</Label>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="h-11 rounded-xl bg-muted/40 text-sm">
                                    <SelectValue placeholder="Select status..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl bg-background">
                                    {STATUSES.map((s) => (
                                        <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            )}

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pb-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="rounded-xl px-6 cursor-pointer"
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="rounded-xl px-6 shadow shadow-primary/20 cursor-pointer"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 size={15} className="animate-spin" />
                            Saving...
                        </span>
                    ) : isEdit ? "Update Employee" : "Add Employee"}
                </Button>
            </div>

        </form>
    );
}