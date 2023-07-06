import { AvatarGenerator } from "random-avatar-generator";

export const generateAvatar = async (name: string, gender: string) => {
  const generator = new AvatarGenerator();
  const avatarData = generator.generateRandomAvatar(name);
  return avatarData
}