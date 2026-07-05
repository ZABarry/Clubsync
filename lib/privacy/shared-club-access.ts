export function canJoinSharedClub(input: {
  isExistingParticipant: boolean;
  isCreator: boolean;
  isFriendOfCreator: boolean;
}): boolean {
  if (input.isExistingParticipant || input.isCreator) return true;
  return input.isFriendOfCreator;
}
