export interface IDropdownChatProps {
  menuTtemRef: any;
}

export type DropdownChatMessageType = 'in' | 'out';

export interface IDropdownMessage {
  avatar: string;
  time: string;
  text: string;
  read?: boolean;
  in?: boolean;
  out?: boolean;
}
