import React from "react";
import Rhythm from "./game/Rhythm";
import TeamUpdate from "./game/TeamUpdate";
import FourWord from "./game/FourWord";
import AbsolutePitch from "./game/AbsolutePitch";
import Picture from "./game/Picture";

function Main({ menu }) {
  switch (menu) {
    case "teamUpdate":
      return <TeamUpdate />;
    case "rhythm":
      return <Rhythm />;
    case "fourWord":
      return <FourWord />;
    case "absolutePitch":
      return <AbsolutePitch />;
    case "picture":
      return <Picture />;
    default:
      return null;
  }
}

export default Main;