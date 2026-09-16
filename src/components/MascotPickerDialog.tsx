import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Gender } from '@/data/types';
import maleUrl from '@/assets/male-normal.png';
import femaleUrl from '@/assets/female-normal.png';

interface MascotPickerDialogProps {
  open: boolean;
  onPick: (gender: Gender) => void;
}

/** 首次使用（或未选择时）挑选首页小人的性别形象 */
export default function MascotPickerDialog({ open, onPick }: MascotPickerDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>选一个陪伴你的小伙伴</DialogTitle>
          <DialogDescription>选择后首页小人会使用对应形象，随时可以切换</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPick('male')}
            className="group rounded-2xl border p-3 text-center transition hover:border-primary hover:bg-primary/5"
          >
            <img
              src={maleUrl}
              alt="男生形象"
              className="mx-auto h-40 w-auto object-contain"
              draggable={false}
            />
            <p className="mt-2 font-medium">男生形象</p>
          </button>
          <button
            type="button"
            onClick={() => onPick('female')}
            className="group rounded-2xl border p-3 text-center transition hover:border-primary hover:bg-primary/5"
          >
            <img
              src={femaleUrl}
              alt="女生形象"
              className="mx-auto h-40 w-auto object-contain"
              draggable={false}
            />
            <p className="mt-2 font-medium">女生形象</p>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
