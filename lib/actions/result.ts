export interface ActionState {
  success: boolean;
  message: string;
}

export const defaultActionState: ActionState = {
  success: false,
  message: "",
};
