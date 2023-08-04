export const getReputationBadgeColor = (
  reputation: number,
  isAdmin = false
) => {
  if (isAdmin) return 'black'
  if (reputation < 200) {
    return 'blue-grey'
  }
  if (reputation >= 200 && reputation < 1000) {
    return 'blue'
  }
  if (reputation >= 1000 && reputation < 5000) {
    return 'indigo'
  }
  if (reputation >= 5000 && reputation < 20000) {
    return 'deep-purple'
  }
  if (reputation >= 20000 && reputation < 50000) {
    return 'purple'
  }
  return 'pink'
}
