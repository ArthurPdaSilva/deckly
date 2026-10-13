// expo-audio depende de módulos nativos; nos testes unitários o player é simulado.
jest.mock(
  "expo-audio",
  () => ({
    useAudioPlayer: jest.fn(() => ({
      play: jest.fn(),
      pause: jest.fn(),
      seekTo: jest.fn().mockResolvedValue(undefined),
    })),
    useAudioPlayerStatus: jest.fn(() => ({
      playing: false,
      didJustFinish: false,
      currentTime: 0,
      duration: 0,
    })),
  }),
  { virtual: true },
);
