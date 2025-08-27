import { atom } from "jotai";
import { ModeType, ToastItem } from "./Types";
import { exampleResultImage, exampleSourceImage } from "./InlinedImages";

export const SourceImageAtom = atom<string>(exampleSourceImage)
export const CurrentPromptAtom = atom<string>("");
export const ResultPromptAtom = atom<string | null>("Put a top hat on it");
export const ResultImageAtom = atom<string | null>(exampleResultImage);
export const ToastItemsAtom = atom<ToastItem[]>([]);
export const ModeAtom = atom<ModeType>("diff");
export const OpacityAtom = atom<number>(0.5);
export const ShowInfoAtom = atom<boolean>(false);
