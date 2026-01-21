import { supabase } from './supabase';

/**
 * Upload an avatar image to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user ID (will be used as folder name)
 * @returns The public URL of the uploaded avatar, or null if upload failed
 */
export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    // Generate a unique filename with timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Replace existing file if it exists
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    return null;
  }
}

/**
 * Delete an avatar from Supabase Storage
 * @param userId - The user ID
 * @returns true if deletion was successful, false otherwise
 */
export async function deleteAvatar(userId: string): Promise<boolean> {
  try {
    // List all files in the user's folder
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(userId);

    if (listError) {
      console.error('Error listing avatar files:', listError);
      return false;
    }

    // Delete all files in the user's folder
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${userId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(filePaths);

      if (deleteError) {
        console.error('Error deleting avatar files:', deleteError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAvatar:', error);
    return false;
  }
}

/**
 * Update the avatar_url in the profiles table
 * @param userId - The user ID
 * @param avatarUrl - The URL of the avatar (or null to remove)
 */
export async function updateProfileAvatarUrl(userId: string, avatarUrl: string | null): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile avatar_url:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateProfileAvatarUrl:', error);
    return false;
  }
}
