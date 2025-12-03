/**
 * Calculates the new streak based on the last active date.
 * 
 * @param {number} currentStreak - The user's current streak count.
 * @param {string|null} lastActiveDate - The ISO string (YYYY-MM-DD) of the last active date.
 * @returns {object} - { streak: number, lastActiveDate: string }
 */
export const calculateStreak = (currentStreak, lastActiveDate) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // If no previous activity, start streak at 1
    if (!lastActiveDate) {
        return { streak: 1, lastActiveDate: todayStr };
    }

    // If already active today, keep current streak
    if (lastActiveDate === todayStr) {
        return { streak: currentStreak, lastActiveDate: todayStr };
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If active yesterday, increment streak
    if (lastActiveDate === yesterdayStr) {
        return { streak: currentStreak + 1, lastActiveDate: todayStr };
    }

    // If missed a day (or more), reset to 1
    return { streak: 1, lastActiveDate: todayStr };
};
