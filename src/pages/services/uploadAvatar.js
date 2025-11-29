import { supabase } from "./SupabaseClient";
import { toast } from "react-hot-toast";

export const uploadAvatar = async (userId, file) => {
  if (!file) return null;

  try {
    const ext = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${ext}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    return signed.signedUrl;
  } catch (err) {
    console.error(err);
    toast.error("Upload failed");
    return null;
  }
};
