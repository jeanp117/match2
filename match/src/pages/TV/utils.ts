import happyAnimation from "../../assets/lottie/happy.json";
import surprisedAnimation from "../../assets/lottie/surprised.json";
import coolAnimation from "../../assets/lottie/cool.json";
import relaxAnimation from "../../assets/lottie/relax.json";

export function getAnimation(emotion: string) {
  switch (emotion) {
    case "happy":
      return happyAnimation;
    case "sad":
      return coolAnimation;
    case "angry":
      return coolAnimation;
    case "surprised":
      return surprisedAnimation;
    default:
      return relaxAnimation;
  }
}
