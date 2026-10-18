const STORAGE_KEY = 'echoes-of-the-grid-save-v1';

const freshSave = () => ({
  bestScore: 0,
  unlockedMission: 0,
  sessions: {}
});

export default class SaveManager {
  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return freshSave();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') throw new Error('Save data is not an object.');
      return {
        ...freshSave(),
        ...parsed,
        bestScore: Number.isFinite(parsed.bestScore) ? parsed.bestScore : 0,
        unlockedMission: Number.isInteger(parsed.unlockedMission) ? parsed.unlockedMission : 0,
        sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {}
      };
    } catch (error) {
      console.warn('Unable to load Echoes of the Grid save data:', error);
      return freshSave();
    }
  }

  static write(save) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
      return true;
    } catch (error) {
      console.warn('Unable to save Echoes of the Grid progress:', error);
      return false;
    }
  }

  static getBestScore() {
    return this.load().bestScore;
  }

  static getUnlockedMission() {
    return this.load().unlockedMission;
  }

  static getSession(missionId) {
    return this.load().sessions[missionId] ?? null;
  }

  static saveSession(missionId, session, score) {
    const save = this.load();
    save.sessions[missionId] = session;
    save.bestScore = Math.max(save.bestScore, score);
    return this.write(save);
  }

  static completeMission(missionIndex, missionId) {
    const save = this.load();
    save.unlockedMission = Math.max(save.unlockedMission, missionIndex + 1);
    delete save.sessions[missionId];
    return this.write(save);
  }

  static clearSession(missionId) {
    const save = this.load();
    delete save.sessions[missionId];
    return this.write(save);
  }
}
