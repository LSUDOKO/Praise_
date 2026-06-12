// Type declarations for missing modules

interface Window {
  ethereum?: {
    isMetaMask?: boolean
    request: (args: { method: string; params?: any[] }) => Promise<any>
    on: (event: string, callback: (...args: any[]) => void) => void
    removeListener: (event: string, callback: (...args: any[]) => void) => void
  }
}

declare module 'react-day-picker' {
  export interface DayPickerProps {
    className?: string
    classNames?: Record<string, string>
    showOutsideDays?: boolean
    captionLayout?: string
    formatters?: Record<string, (date: Date) => string>
    components?: Record<string, React.ComponentType<any>>
    [key: string]: any
  }

  export interface DayButtonProps {
    className?: string
    day: {
      date: Date
      displayMonth: Date
    }
    modifiers: {
      selected?: boolean
      range_start?: boolean
      range_end?: boolean
      range_middle?: boolean
      focused?: boolean
      today?: boolean
      outside?: boolean
      disabled?: boolean
      hidden?: boolean
    }
    [key: string]: any
  }

  export function DayPicker(props: DayPickerProps): JSX.Element
  export function DayButton(props: DayButtonProps): JSX.Element
  export function getDefaultClassNames(): Record<string, string>
}

declare module '@metamask/smart-accounts-kit' {
  export enum Implementation {
    Hybrid = 'hybrid',
    Simple = 'simple',
  }

  export interface SmartAccount {
    address: `0x${string}`
    deploy(): Promise<`0x${string}`>
    [key: string]: any
  }

  export interface ToMetaMaskSmartAccountParams {
    client: any
    implementation: Implementation
    deployParams: any[]
    deploySalt: string
    signer: { walletClient: any } | { privateKey: `0x${string}` }
  }

  export function toMetaMaskSmartAccount(
    params: ToMetaMaskSmartAccountParams
  ): Promise<SmartAccount>

  export function getSmartAccountsEnvironment(chainId: number): any
  export const CaveatType: Record<string, string>
}

declare module '@metamask/smart-accounts-kit/actions' {
  export interface WalletClientWithPermissions {
    requestExecutionPermissions: (permissions: any[]) => Promise<any>
    getSupportedExecutionPermissions: () => Promise<any[]>
    getGrantedExecutionPermissions: () => Promise<any[]>
    [key: string]: any
  }

  export function erc7715ProviderActions(): (client: any) => WalletClientWithPermissions
}
