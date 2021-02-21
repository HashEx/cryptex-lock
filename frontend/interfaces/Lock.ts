export interface Lock {
    amount: string;
    initialAmount: string;
    lockDate: number;
    unlockDate: number;
    lockId: number;
    owner: string;
    index: number;
}