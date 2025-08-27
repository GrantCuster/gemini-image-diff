import { atom } from "jotai";
import { ModeType, ToastItem } from "./Types";

export const SourceImageAtom = atom<string>("images/octopus.jpg");
export const CurrentPromptAtom = atom<string>("");
export const ResultPromptAtom = atom<string | null>("Put a top hat on it");
export const ResultImageAtom = atom<string | null>("images/top-hat-example.png");
export const ToastItemsAtom = atom<ToastItem[]>([]);
export const ModeAtom = atom<ModeType>("diff");
export const OpacityAtom = atom<number>(0.5);
export const ShowInfoAtom = atom<boolean>(false);
