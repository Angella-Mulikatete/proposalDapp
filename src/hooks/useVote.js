import { useCallback } from "react";
import { toast } from "react-toastify";
import useContract from "./useContract";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAppKitNetwork } from "@reown/appkit/react";
import { liskSepoliaNetwork } from "../connection";
// import { parseEther } from "ethers";

const useVote = () => {
    const contract = useContract(true);
    const { address } = useAppKitAccount();
    const { chainId } = useAppKitNetwork();

    
    return useCallback(
        async (proposalId) => {
        
            if (Number(chainId) !== liskSepoliaNetwork.chainId) {
                toast.error("You are not connected to the right network");
                return;
            }

            if (!contract) {
                toast.error("Cannot get contract!");
                return;
            }

            try {
                const estimatedGas = await contract.vote.estimateGas(proposalId );
                const tx = await contract.vote(proposalId, estimatedGas);
                const reciept = await tx.wait();

                if (reciept.status === 1) {
                    toast.success("vote successful");
                    return;
                }
                toast.error("vote failed");
                return;
            } catch (error) {
                console.error("error while creating proposal: ", error);
                toast.error("vote errored");
            }
        },
        [address, chainId, contract]
    );
};

export default useVote;
