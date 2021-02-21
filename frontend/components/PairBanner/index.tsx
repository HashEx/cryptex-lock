import React from "react"
import { useWallet } from "use-wallet"
import { Pair } from "../../interfaces/Pair"
import Button from "../button"
import Card from "../Card"
import PairLabel from "../PairLabel"
import TextAlign from "../Text/TextAlign"


interface IPairBannerProps {
    pair: Pair;
    onContinue: () => void;
}

const PairBanner: React.FC<IPairBannerProps> = ({pair, onContinue}) => {
    const wallet = useWallet();
    const userLocks = pair.locks.filter(lock => {
        return lock.owner === wallet.account && parseFloat(lock.amount) > 0
    });
    return (
        <Card>
            <TextAlign.Center>
                <h3>Pair found</h3>
            </TextAlign.Center>
            <PairLabel pair={pair} center />
            <TextAlign.Center>
                <div>User locks amount: {userLocks.length}</div>
            </TextAlign.Center>
            <Button block onClick={onContinue}>
                Continue
            </Button>
        </Card>
    )
}

export default PairBanner;