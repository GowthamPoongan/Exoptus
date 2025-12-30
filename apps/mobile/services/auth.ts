// Local wrapper to re-export the workspace auth service
// This lets files import "../../services/auth" or similar inside the app
import auth from "../../../services/auth";

export const authService = auth;
export default auth;
