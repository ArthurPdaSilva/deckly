import { fireEvent, render } from "@testing-library/react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { AudioPlayButton } from "../../../features/cards/AudioPlayButton";
import { ThemeProvider } from "../../../styles/ThemeProvider";

function createPlayer() {
  return {
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
  };
}

function renderButton() {
  return render(
    <ThemeProvider mode="light">
      <AudioPlayButton uri="file:///docs/card-audio/audio-1.mp3" />
    </ThemeProvider>,
  );
}

describe("AudioPlayButton", () => {
  it("plays the attached audio", () => {
    const player = createPlayer();
    jest.mocked(useAudioPlayer).mockReturnValue(player as never);
    jest.mocked(useAudioPlayerStatus).mockReturnValue({
      playing: false,
      didJustFinish: false,
      currentTime: 0,
      duration: 3,
    } as never);

    const screen = renderButton();
    fireEvent.press(screen.getByText("▶ Tocar áudio"));

    expect(useAudioPlayer).toHaveBeenCalledWith({
      uri: "file:///docs/card-audio/audio-1.mp3",
    });
    expect(player.play).toHaveBeenCalled();
  });

  it("pauses while the audio is playing", () => {
    const player = createPlayer();
    jest.mocked(useAudioPlayer).mockReturnValue(player as never);
    jest.mocked(useAudioPlayerStatus).mockReturnValue({
      playing: true,
      didJustFinish: false,
      currentTime: 1,
      duration: 3,
    } as never);

    const screen = renderButton();
    fireEvent.press(screen.getByText("⏸ Pausar áudio"));

    expect(player.pause).toHaveBeenCalled();
    expect(player.play).not.toHaveBeenCalled();
  });

  it("restarts from the beginning after the audio finished", () => {
    const player = createPlayer();
    jest.mocked(useAudioPlayer).mockReturnValue(player as never);
    jest.mocked(useAudioPlayerStatus).mockReturnValue({
      playing: false,
      didJustFinish: false,
      currentTime: 3,
      duration: 3,
    } as never);

    const screen = renderButton();
    fireEvent.press(screen.getByText("▶ Tocar áudio"));

    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).toHaveBeenCalled();
  });
});
