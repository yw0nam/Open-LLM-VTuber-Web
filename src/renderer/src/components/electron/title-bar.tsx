import { Box } from "@chakra-ui/react";
import { layoutStyles } from "@/layout";

function TitleBar(): JSX.Element {
  const isMac = window.electron?.process.platform === "darwin";

  if (isMac) {
    return (
      <Box {...layoutStyles.macTitleBar}>
        <Box {...layoutStyles.titleBarTitle}>Open LLM VTuber</Box>
      </Box>
    );
  }

  return (
    <Box
      style={
        {
          height: "30px",
          width: "100%",
          "-webkit-app-region": "drag",
          backgroundColor: "#1A202C",
          color: "#FFFFFF",
        } as React.CSSProperties
      }
    >
      <Box {...layoutStyles.titleBarTitle}>Open LLM VTuber</Box>
    </Box>
  );
}

export default TitleBar;
