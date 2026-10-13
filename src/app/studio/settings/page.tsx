import type { Metadata } from "next";
import { ProviderSettings } from "../../../components/ProviderSettings";
export const metadata: Metadata = { title: "Settings" };
export default function SettingsPage(){return <ProviderSettings/>;}
