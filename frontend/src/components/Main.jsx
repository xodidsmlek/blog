import React from "react";
import Rhythm from "./game/Rhythm";
import TeamUpdate from "./game/TeamUpdate";
import FourWord from "./game/FourWord";
import AbsolutePitch from "./game/AbsolutePitch";
import Picture from "./game/Picture";
import StockGameManager from "./game/StockGameManager";
import StockAdmin from "./game/StockAdmin";
import StockUser from "./game/StockUser";

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
    case "stockGameManager":
      return <StockGameManager />;
    case "stockAdmin":
      return <StockAdmin />;
    case "stockUser":
      return <StockUser />;
    default:
      return null;
  }
}

export default Main;