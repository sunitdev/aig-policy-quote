import type { UIInputsResponse } from "@policy-quote/api-contract";

import { getUIInputs } from "../services/knowledgeBase";

export function getQuoteUIInputsEndpoint(): UIInputsResponse {
  return getUIInputs();
}
