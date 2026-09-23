import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";

export default defineMcpClientConnection({
  url: "https://mcp.onkernel.com/mcp",
  description: "Kernel cloud browsers for AI agents",
  auth: connect("mcp.onkernel.com/prj_UVa2Kof8OSITLyYEnxgJ35axW8ma"),
});
