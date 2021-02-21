import { useState, useEffect } from 'react';
import pancakeswapService from '../services/api/pancakeswapService';


export const useLockSteps = () => {
    const [step, setStep] = useState<"initial" | "lock">("initial");
    const [address, setAddress] = useState<string>('');
    const [pair, setPair] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const onChangeAddress = (value: string) => {
        setAddress(value);
    }
    const onContinue = () => {
        setStep("lock")
    }
    const onBack = () => {
        setStep("initial");
    };
    const fetchPair = async (address: string) => {
        setLoading(true);
        try {
            const pair = await pancakeswapService.findPair(address);
            if(pair){
                setPair(pair);
            }
        } catch(e) {
            console.error(e);
        }
        setLoading(false);
    }
    useEffect(() => {
        if(address){
            fetchPair(address);
        }
    }, [address]);

    return {
        address,
        loading,
        pair,
        step,
        onChangeAddress,
        onContinue,
        onBack,
    }
}