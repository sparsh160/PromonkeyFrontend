"use client";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { cn } from "@/lib/utils";

const schema = z.object({
    clientName: z.string().min(1, "Client name is required").regex(/^[a-zA-Z\s]+$/, "Client name can only contain letters and spaces"),
    companyName: z.string().optional(),
    email:       z.string().email("Invalid email").optional().or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")).refine((val) => !val || /^\d{9,15}$/.test(val), {message: "Phone number must be between 9 and 15 digits and contain only numbers",}),
    address:     z.string().optional(),
    notes:       z.string().optional(),
});

export function ClientForm({ defaultValues, onSave, onCancel }) {
    const isEdit = !!defaultValues;
    const [submitError,  setSubmitError]  = useState("");
    const [imagePreview, setImagePreview] = useState(
        defaultValues?.profileImage?.url ?? null
    );
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            clientName:  defaultValues?.clientName  ?? "",
            companyName: defaultValues?.companyName ?? "",
            email:       defaultValues?.email       ?? "",
            password:    "",
            phone:       defaultValues?.phone       ?? "",
            address:     defaultValues?.address     ?? "",
            notes:       defaultValues?.notes       ?? "",
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
                    <div className="w-16 h-16 rounded-2xl bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Building2 size={24} className="text-muted-foreground" />
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

            {/* Client Name + Company */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">
                        Client Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        {...register("clientName")}
                        placeholder="Rahul Sharma"
                        className={cn(
                            "h-11 rounded-xl bg-muted/40 text-sm",
                            errors.clientName && "border-destructive"
                        )}
                    />
                    {errors.clientName && (
                        <p className="text-xs text-destructive">{errors.clientName.message}</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Company Name</Label>
                    <Input
                        {...register("companyName")}
                        placeholder="Sharma Pvt Ltd"
                        className="h-11 rounded-xl bg-muted/40 text-sm"
                    />
                </div>
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Email</Label>
                    <Input
                        {...register("email")}
                        type="email"
                        placeholder="rahul@sharma.com"
                        className={cn(
                            "h-11 rounded-xl bg-muted/40 text-sm",
                            errors.email && "border-destructive"
                        )}
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                </div>
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
            </div>
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                    Password {!isEdit && <span className="text-destructive">*</span>}
                </Label>

                <Input
                    {...register("password")}
                    type="password"
                    placeholder="Enter password"
                    className={cn(
                        "h-11 rounded-xl bg-muted/40 text-sm",
                        errors.password && "border-destructive"
                    )}
                />

                {errors.password && (
                    <p className="text-xs text-destructive">
                        {errors.password.message}
                    </p>
                )}

                {isEdit && (
                    <p className="text-[11px] text-muted-foreground">
                        Leave blank to keep current password
                    </p>
                )}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Address</Label>
                <Input
                    {...register("address")}
                    placeholder="Mumbai, India"
                    className="h-11 rounded-xl bg-muted/40 text-sm"
                />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Notes</Label>
                <textarea
                    {...register("notes")}
                    placeholder="Any additional notes about this client..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
            </div>

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
                    ) : isEdit ? "Update Client" : "Add Client"}
                </Button>
            </div>
        </form>
    );
}