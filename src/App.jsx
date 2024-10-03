import { Box } from "@radix-ui/themes";
import Layout from "./components/Layout";
import CreateProposalModal from "./components/CreateProposalModal";
import Proposals from "./components/Proposals";
import useContract from "./hooks/useContract";
import { useCallback, useEffect, useState } from "react";
import { Contract } from "ethers";
import useRunners from "./hooks/useRunners";
import { Interface } from "ethers";
import ABI from "./ABI/proposal.json";
// import useVote from "./hooks/useVote";
// import { toast } from "react-toastify";

const multicallAbi = [
    "function tryAggregate(bool requireSuccess, (address target, bytes callData)[] calls) returns ((bool success, bytes returnData)[] returnData)",
];

function App() {
    const readOnlyProposalContract = useContract(true);
    const { readOnlyProvider } = useRunners();
    const [proposals, setProposals] = useState([]);
    //  const [latestProposalId, setLatestProposalId] = useState([]);
    // const vote = useVote();

    const fetchProposals = useCallback(async () => {
        if (!readOnlyProposalContract) return;

        const multicallContract = new Contract(
            import.meta.env.VITE_MULTICALL_ADDRESS,
            multicallAbi,
            readOnlyProvider
        );

        const itf = new Interface(ABI);

        try {
            const proposalCount = Number(
                await readOnlyProposalContract.proposalCount()
            );

            const proposalsIds = Array.from(
                { length: proposalCount - 1 },
                (_, i) => i + 1
            );

            const calls = proposalsIds.map((id) => ({
                target: import.meta.env.VITE_CONTRACT_ADDRESS,
                callData: itf.encodeFunctionData("proposals", [id]),
            }));

            const responses = await multicallContract.tryAggregate.staticCall(
                true,
                calls
            );

            const decodedResults = responses.map((res) =>
                itf.decodeFunctionResult("proposals", res.returnData)
            );

            const data = decodedResults.map((proposalStruct, index) => ({
                proposalId:proposalsIds[index],
                description: proposalStruct.description,
                amount: proposalStruct.amount,
                minRequiredVote: proposalStruct.minVotesToPass,
                votecount: proposalStruct.voteCount,
                deadline: proposalStruct.votingDeadline,
                executed: proposalStruct.executed,
            }));
          
            setProposals(data);
        } catch (error) {
            console.log("error fetching proposals: ", error);
        }
    }, [readOnlyProposalContract, readOnlyProvider]);

       const handleNewProposal = useCallback((proposalId, description, recipient, amount, votingDeadline, minVotesToPass) => {
            console.log("New Proposal Created:", {
                proposalId: proposalId.toString(),
                description,
                recipient,
                amount: amount.toString(),
                votingDeadline: votingDeadline.toString(),
                minVotesToPass: minVotesToPass.toString(),
            });
        
            fetchProposals(); 
        }, [fetchProposals]);


        const handleVote = useCallback(
            async(proposalId) =>{
                console.log("New Vote Recorded:", { proposalId: proposalId.toString()});
        
              setProposals((prevProposals) =>
                prevProposals.map((proposal) =>
                    proposal.proposalId === proposalId.toString()
                        ? { ...proposal, voteCount: (parseInt(proposal.voteCount) + 1) }
                        : proposal
                )
            );
            }, []
        );

    useEffect(()=>{
        fetchProposals();

        if (!readOnlyProposalContract) return;

        readOnlyProposalContract.on("ProposalCreated",handleNewProposal);
        readOnlyProposalContract.on("Voted", handleVote);

        return ()=>{
            readOnlyProposalContract.removeListener('ProposalCreated', handleNewProposal);
            readOnlyProposalContract.removeListener("Voted", handleVote);
        }

    }, [readOnlyProvider,readOnlyProposalContract]);


    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    return (
        <Layout>
            <Box className="flex justify-end p-4">
                <CreateProposalModal />
            </Box>
            <Proposals 
                proposals={proposals} 
                handleVote={handleVote}
            />
        </Layout>
    );
}

export default App;

     // readOnlyProposalContract.on("ProposalCreated", (value)=>{
        //     console.log("Proposal", value);
        //     fetchProposals();
        // });

// const handleVote = (proposalId) => {
    //     console.log("ProposalId", proposalId)
    //     try {
    //             //const estimatedGas =  readOnlyProposalContract.vote.estimateGas(proposalId );
    //             const tx =  readOnlyProposalContract.vote(proposalId);
    //             console.log("tx", tx);
    //             const reciept =  tx.wait();

    //             if (reciept.status === 1) {
    //                 toast.success("voting successful");
    //                 return;
    //             }
    //             toast.error("voting failed");
    //             return;
    //         } catch (error) {
    //             console.error("error while creating proposal: ", error);
    //             toast.error("voting errored");
    //         }
    // }


    // readOnlyProposalContract.on(filter, (proposalId, description,recipient, amount, votingDeadline, minVotesToPass)=>{
        //     const proposalCreated = {
        //         proposalId: proposalId.toString(),
        //         description,
        //         recipient,
        //         amount: (amount),
        //         votingDeadline: new Date(votingDeadline * 1000).toLocaleString(),
        //         minVotesToPass: minVotesToPass.toString(),
        //     }
        //     console.log("ProposalCreated", proposalCreated.proposalId);

        //     setLatestProposalId(proposalCreated.proposalId.toString());

        //     return{latestProposalId}
        // });

        // readOnlyProposalContract.on(filter, (event)=>{
        //     const proposal = event.args
        //     const proposalCreated = {
        //         proposalId: proposal.proposalId,
        //         description: proposal.description,
        //         amount: proposal.amount,
        //         votingDeadline: proposal.votingDeadline,
        //         minVotesToPass: proposal.minVotesToPass,
        //     }
        //     console.log("ProposalCreated", proposalCreated.proposalId);

        //     setLatestProposalId(proposalCreated.proposalId);

        //     return{latestProposalId}
        // });
