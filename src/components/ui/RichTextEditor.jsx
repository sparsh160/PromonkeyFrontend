"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import {StarterKit} from "@tiptap/starter-kit";
import {Placeholder} from "@tiptap/extension-placeholder";
import {Underline} from "@tiptap/extension-underline";
import {TextAlign} from "@tiptap/extension-text-align";
import {TextStyle} from "@tiptap/extension-text-style";
import {Highlight} from "@tiptap/extension-highlight";
import {Link} from "@tiptap/extension-link";
import {CharacterCount} from "@tiptap/extension-character-count";
import {Image} from "@tiptap/extension-image";
import { Node, mergeAttributes } from "@tiptap/core";
import { useEffect, useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
    Bold, Italic, Underline as UnderlineIcon,
    Strikethrough, Code, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
    List, ListOrdered, AlignLeft, AlignCenter,
    AlignRight, Quote, Highlighter, Link as LinkIcon,
    Undo, Redo, Minus, Image as ImageIcon, Video as VideoIcon, Code2, Loader2
} from "lucide-react";

/* ── Import your API helpers ── */
import { API_BASE, getToken } from "@/lib/api"; // Adjust this path to match your file structure

/* ── Custom Video Extension ── */
const Video = Node.create({
    name: 'video',
    group: 'block',
    selectable: true,
    draggable: true,
    atom: true,

    addAttributes() {
        return {
            src: { default: null },
            controls: { default: true },
            class: { default: 'max-w-full rounded-lg my-4' },
            'data-public-id': { default: null }, // Save publicId so we can delete it later
            'data-file-type': { default: null }
        }
    },

    parseHTML() {
        return [{ tag: 'video[src]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['video', mergeAttributes(HTMLAttributes)]
    },

    addCommands() {
        return {
            setVideo: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                })
            },
        }
    },
});

/* ── Updated Image Extension to track extra fields ── */
const CustomImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            'data-public-id': { default: null },
            'data-file-type': { default: null }
        }
    }
});

function ToolBtn({ onClick, active, disabled, title, children }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            disabled={disabled}
            title={title}
            className={cn(
                "w-7 h-7 flex items-center justify-center rounded-md text-xs transition-colors",
                active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                disabled && "opacity-40 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}

export function RichTextEditor({
    value = "",
    onChange,
    placeholder = "Write something...",
    className = "",
    minHeight = "min-h-[200px]",
    maxChars = null,
    error = false,
}) {
    const fileInputRef = useRef(null);
    const mediaTypeRef = useRef("image");
    const [isUploading, setIsUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: { keepMarks: true },
                orderedList: { keepMarks: true },
                heading: { levels: [1, 2, 3, 4, 5, 6] }
            }),
            Underline,
            TextStyle,
            Highlight.configure({ multicolor: false }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
            CharacterCount.configure({ limit: maxChars ?? undefined }),
            CustomImage.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg my-4 inline-block',
                },
            }),
            Video,
            Placeholder.configure({
                placeholder,
                emptyEditorClass: "before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none before:h-0",
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm max-w-none focus:outline-none px-4 py-3 selection:bg-primary/10",
                    minHeight,
                    "prose-h1:text-3xl prose-h1:font-extrabold prose-h1:mt-6 prose-h1:mb-4 prose-h1:text-foreground",
                    "prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-5 prose-h2:mb-3 prose-h2:text-foreground",
                    "prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-foreground",
                    "prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-3 prose-h4:mb-2 prose-h4:text-foreground",
                    "prose-h5:text-base prose-h5:font-medium prose-h5:mt-2 prose-h5:mb-1 prose-h5:text-foreground",
                    "prose-h6:text-sm prose-h6:font-medium prose-h6:mt-2 prose-h6:mb-1 prose-h6:text-foreground",
                    "prose-p:text-sm prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-3",
                    "prose-strong:text-foreground prose-strong:font-bold",
                    "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
                    "prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:border prose-pre:border-border prose-pre:my-3 prose-pre:text-foreground",
                    "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:italic prose-blockquote:pl-4 prose-blockquote:text-muted-foreground prose-blockquote:my-4",
                    "prose-ul:list-disc prose-ul:pl-5 prose-ul:text-foreground prose-ol:list-decimal prose-ol:pl-5 prose-ol:text-foreground",
                    "prose-a:text-primary hover:prose-a:underline"
                ),
            },
        },
    });

    useEffect(() => {
        if (!editor) return;
        const current = editor.getHTML();
        if (value !== current) {
            editor.commands.setContent(value ?? "", false);
        }
    }, [value, editor]);

    const setLink = useCallback(() => {
        if (!editor) return;
        const prev = editor.getAttributes("link").href;
        const url = window.prompt("Enter URL", prev ?? "https://");
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    /* Insert link embeds directly */
    const insertMediaViaLink = (type) => {
        if (!editor) return;
        const url = window.prompt(`Enter ${type === 'image' ? 'Image' : 'Video'} URL:`);
        if (!url) return;

        if (type === 'image') {
            editor.chain().focus().setImage({ src: url }).run();
        } else {
            editor.commands.setVideo({ src: url });
        }
    };

    const triggerDesktopUpload = (type) => {
        mediaTypeRef.current = type;
        fileInputRef.current?.click();
    };

    /* ── API CALL: POST MULTIPART FILE ── */
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        const token = getToken();
        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsUploading(true);

            // Fetch natively to cleanly pass multipart form boundaries without text/json conflicts
            const response = await fetch(`${API_BASE}/api/upload/editor-file`, {
                method: "POST",
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                    // CRITICAL: Leave Content-Type out so the browser formats multipart boundaries automatically
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed with status code ${response.status}`);
            }

            const data = await response.json();

            // Insert media along with meta trackers to enable backend server-side deletions later
            if (mediaTypeRef.current === "image") {
                editor.chain().focus().setImage({ 
                    src: data.url, 
                    'data-public-id': data.publicId, 
                    'data-file-type': data.fileType 
                }).run();
            } else {
                editor.commands.setVideo({ 
                    src: data.url, 
                    'data-public-id': data.publicId, 
                    'data-file-type': data.fileType 
                });
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert(err.message || "Something went wrong uploading your file.");
        } finally {
            setIsUploading(false);
            e.target.value = ""; // flush input target cache
        }
    };

    if (!editor) return null;

    const charCount = editor.storage.characterCount?.characters() ?? 0;
    const wordCount = editor.storage.characterCount?.words() ?? 0;
    const atLimit = maxChars && charCount >= maxChars;

    return (
        <div className={cn(
            "rounded-xl border transition-colors overflow-hidden bg-background relative",
            error ? "border-destructive ring-1 ring-destructive/20" : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
            className
        )}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={mediaTypeRef.current === "image" ? "image/*" : "video/*"}
                onChange={handleFileChange}
            />

            {/* ── Visual Loading Overlay during uploads ── */}
            {isUploading && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center gap-2 text-xs font-medium text-muted-foreground animate-fade-in">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Uploading asset to server...</span>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/30">
                <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={13} /></ToolBtn>

                <Divider />

                <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1"><Heading1 size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive("heading", { level: 4 })} title="Heading 4"><Heading4 size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()} active={editor.isActive("heading", { level: 5 })} title="Heading 5"><Heading5 size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()} active={editor.isActive("heading", { level: 6 })} title="Heading 6"><Heading6 size={13} /></ToolBtn>

                <Divider />

                <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UnderlineIcon size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline Code"><Code size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block"><Code2 size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight"><Highlighter size={13} /></ToolBtn>

                <Divider />

                <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List"><List size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List"><ListOrdered size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote"><Quote size={13} /></ToolBtn>

                <Divider />

                <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left"><AlignLeft size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center"><AlignCenter size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right"><AlignRight size={13} /></ToolBtn>

                <Divider />

                <ToolBtn onClick={setLink} active={editor.isActive("link")} title="Insert Link"><LinkIcon size={13} /></ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus size={13} /></ToolBtn>

                <Divider />

                {/* Media Desktop Actions */}
                <ToolBtn onClick={() => triggerDesktopUpload("image")} title="Upload Image From Desktop"><ImageIcon size={13} className="text-blue-500" /></ToolBtn>
                <ToolBtn onClick={() => insertMediaViaLink("image")} title="Embed Image via Link"><LinkIcon size={11} className="text-blue-500 mr-[-2px]" /><ImageIcon size={11} className="text-blue-500" /></ToolBtn>
                
                <ToolBtn onClick={() => triggerDesktopUpload("video")} title="Upload Video From Desktop"><VideoIcon size={13} className="text-emerald-500" /></ToolBtn>
                <ToolBtn onClick={() => insertMediaViaLink("video")} title="Embed Video via Link"><LinkIcon size={11} className="text-emerald-500 mr-[-2px]" /><VideoIcon size={11} className="text-emerald-500" /></ToolBtn>
            </div>

            <div className="w-full bg-background">
                <EditorContent editor={editor} />
            </div>

            <div className={cn(
                "flex items-center justify-end gap-3 px-4 py-1.5 border-t border-border bg-muted/20",
                atLimit && "bg-destructive/5"
            )}>
                <span className={cn(
                    "text-[10px] font-medium",
                    atLimit ? "text-destructive" : "text-muted-foreground"
                )}>
                    {wordCount} words
                    {maxChars && (
                        <> · <span className={atLimit ? "text-destructive font-bold" : ""}>
                            {charCount}/{maxChars} chars
                        </span></>
                    )}
                </span>
            </div>
        </div>
    );
}