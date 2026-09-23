import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";

export default defineMcpClientConnection({
  url: "https://mcp.stripe.com",
  description: "Payment processing and financial infrastructure tools",
  auth: connect("mcp.stripe.com/prj_UVa2Kof8OSITLyYEnxgJ35axW8ma"),
});
