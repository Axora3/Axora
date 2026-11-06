"use client";

import { useState } from "react";
import { Copy, EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HoverLift, InView, Pressable } from "@/components/ui/motion-interactions";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger className={buttonStyles("primary")}>Цонх нээх</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Захиалгаа баталгаажуулах уу?</DialogTitle>
          <DialogDescription>Утсан дээр доороосоо гарч, том дэлгэцэд голлоно. Esc товч, арын дэвсгэр, хаах товчоор хаагдана.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose className={buttonStyles("secondary")}>Болих</DialogClose>
          <DialogClose className={buttonStyles("primary")}>Баталгаажуулах</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DropdownDemo() {
  const [sort, setSort] = useState("new");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Үйлдлүүд" className={buttonStyles("secondary", "", "icon")}>
        <EllipsisVertical aria-hidden="true" size={18} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Үйлдэл</DropdownMenuLabel>
        <DropdownMenuItem><Pencil aria-hidden="true" size={16} /> Засах</DropdownMenuItem>
        <DropdownMenuItem><Copy aria-hidden="true" size={16} /> Хуулах</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Эрэмбэ</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuRadioItem value="new">Шинэ нь эхэндээ</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="old">Хуучин нь эхэндээ</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger"><Trash2 aria-hidden="true" size={16} /> Устгах</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SelectDemo() {
  return (
    <Select>
      <SelectTrigger aria-label="Ангилал" className="max-w-[280px]">
        <SelectValue placeholder="Ангилал сонгох" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Загвар</SelectLabel>
          <SelectItem value="excel">Excel загвар</SelectItem>
          <SelectItem value="notion">Notion загвар</SelectItem>
          <SelectItem value="canva">Canva загвар</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value="web">Захиалгат вебсайт</SelectItem>
        <SelectItem value="none" disabled>Удахгүй нэмэгдэнэ</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function TabsDemo() {
  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Жишээ хэсгүүд">
        <TabsTrigger value="overview">Тойм</TabsTrigger>
        <TabsTrigger value="details">Дэлгэрэнгүй</TabsTrigger>
        <TabsTrigger value="updates">Шинэчлэлт</TabsTrigger>
      </TabsList>
      <TabsContent value="overview"><p className="ax-body text-muted">Идэвхтэй табын дэвсгэр Motion-оор гулсана.</p></TabsContent>
      <TabsContent value="details"><p className="ax-body text-muted">Сум товчоор табуудын хооронд шилжинэ.</p></TabsContent>
      <TabsContent value="updates"><p className="ax-body text-muted">Шүүлтүүрт Tabs биш Segmented ашиглана.</p></TabsContent>
    </Tabs>
  );
}

export function TooltipDemo() {
  return (
    <Tooltip label="Холбоосыг хуулна">
      <button type="button" aria-label="Хуулах" className={buttonStyles("secondary", "", "icon")}>
        <Copy aria-hidden="true" size={18} />
      </button>
    </Tooltip>
  );
}

export function LoadingButtonDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="primary"
      loading={loading}
      onClick={() => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1600);
      }}
    >
      {loading ? "Хадгалж байна…" : "Хадгалах"}
    </Button>
  );
}

export function MotionDemo() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <InView className="ax-panel"><p className="text-sm font-bold">InView</p><p className="ax-caption">Дэлгэцэд орохдоо зөөлөн гарна.</p></InView>
      <HoverLift className="ax-panel cursor-pointer"><p className="text-sm font-bold">HoverLift</p><p className="ax-caption">Hover хийхэд дээшилнэ.</p></HoverLift>
      <Pressable className="ax-panel cursor-pointer text-left"><p className="text-sm font-bold">Pressable</p><p className="ax-caption">Дарахад бага зэрэг шахагдана.</p></Pressable>
    </div>
  );
}
