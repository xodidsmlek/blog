import React from "react";
import Rhythm from "./game/Rhythm";
import TeamUpdate from "./game/TeamUpdate";
import FourWord from "./game/FourWord";

function Main({ menu }) {
  switch (menu) {
    case "teamUpdate":
      return <TeamUpdate />;
    case "rhythm":
      return <Rhythm />;
    case "fourWord":
      return <FourWord />;
    default:
      return null;
  }
}

export default Main;