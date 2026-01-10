"use client"

import { Editor } from "@tiptap/react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Link2,
  ImagePlus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Undo,
  Redo,
  Type,
  ChevronDown,
} from "lucide-react"
import { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

interface MenuBarProps {
  editor: Editor | null
}

const fonts = [
  { name: "Default", value: "" },
  { name: "DM Sans", value: "DM Sans" },
  { name: "Inter", value: "Inter" },
  { name: "Georgia", value: "Georgia" },
  { name: "Times New Roman", value: "Times New Roman" },
  { name: "Courier New", value: "Courier New" },
  { name: "Comic Sans MS", value: "Comic Sans MS" },
]

const colors = [
  { name: "Default", value: "#000000" },
  { name: "Gray", value: "#6b7280" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
]

export function MenuBar({ editor }: MenuBarProps) {
  const [showFontDropdown, setShowFontDropdown] = useState(false)
  const [showColorDropdown, setShowColorDropdown] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && editor) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result
        if (typeof result === "string") {
          editor.chain().focus().setImage({ src: result }).run()
        }
      }
      reader.readAsDataURL(file)
    }
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return
    
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
    }
    setShowLinkInput(false)
    setLinkUrl("")
  }, [editor, linkUrl])

  if (!editor) {
    return null
  }

  const MenuButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    children: React.ReactNode
    title?: string
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded-lg transition-all duration-200 hover:bg-pink-50 hover:text-pink-600",
        isActive ? "bg-pink-100 text-pink-600" : "text-gray-600",
        disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-600"
      )}
    >
      {children}
    </button>
  )

  const Divider = () => <div className="w-px h-6 bg-gray-200 mx-1" />

  return (
    <div className="border-b border-gray-200 bg-gray-50/50 px-4 py-3">
      <div className="flex flex-wrap items-center gap-1">
        {/* Undo/Redo */}
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </MenuButton>

        <Divider />

        {/* Font Family Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFontDropdown(!showFontDropdown)
              setShowColorDropdown(false)
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200"
          >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Font</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showFontDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 min-w-[160px]">
              {fonts.map((font) => (
                <button
                  key={font.value}
                  onClick={() => {
                    if (font.value) {
                      editor.chain().focus().setFontFamily(font.value).run()
                    } else {
                      editor.chain().focus().unsetFontFamily().run()
                    }
                    setShowFontDropdown(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  style={{ fontFamily: font.value || "inherit" }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowColorDropdown(!showColorDropdown)
              setShowFontDropdown(false)
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200"
          >
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: editor.getAttributes("textStyle").color || "#000000" }}
            />
            <ChevronDown className="w-3 h-3" />
          </button>
          {showColorDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50">
              <div className="grid grid-cols-5 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      editor.chain().focus().setColor(color.value).run()
                      setShowColorDropdown(false)
                    }}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* Headings */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </MenuButton>

        <Divider />

        {/* Text Formatting */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </MenuButton>

        <Divider />

        {/* Alignment */}
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </MenuButton>

        <Divider />

        {/* Lists */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive("taskList")}
          title="Task List"
        >
          <CheckSquare className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </MenuButton>

        <Divider />

        {/* Link */}
        <div className="relative">
          <MenuButton
            onClick={() => setShowLinkInput(!showLinkInput)}
            isActive={editor.isActive("link")}
            title="Add Link"
          >
            <Link2 className="w-4 h-4" />
          </MenuButton>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setLink()}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent w-48"
                />
                <button
                  onClick={setLink}
                  className="px-3 py-1.5 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Image Upload */}
        <MenuButton onClick={() => fileInputRef.current?.click()} title="Add Image">
          <ImagePlus className="w-4 h-4" />
        </MenuButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}

