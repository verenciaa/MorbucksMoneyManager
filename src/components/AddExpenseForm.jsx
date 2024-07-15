import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router-dom";
import { PlusCircleIcon } from "@heroicons/react/24/solid";
import Modal from "react-modal";
import { ocrPredict } from "../helpers.js";

const AddExpenseForm = ({ budgets }) => {
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === "submitting";

    const formRef = useRef();
    const focusRef = useRef();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (!isSubmitting) {
            formRef.current.reset();
            focusRef.current.focus();
        }
    }, [isSubmitting]);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleScanReceipt = async () => {
        if (!selectedFile) return;

        setIsScanning(true);
        const reader = new FileReader();

        reader.onloadend = async () => {
            const imageBase64 = reader.result.split(",")[1];
            try {
                const response = await ocrPredict(imageBase64);
                console.log("OCR Response:", response);

                // Function to search for total or subtotal amount
                const findAmount = (lines) => {
                    const totalRegex = /(TOTAL|SUBTOTAL)\s*:?\s*([\d,]+)/i; // Regex to match "TOTAL 14,000" or "SUBTOTAL: 14,000" (with optional colon)
                    for (let line of lines) {
                        const match = totalRegex.exec(line);
                        if (match) {
                            return parseFloat(match[2].replace(",", ""));
                        }
                    }
                    return null;
                };

                // Find total or subtotal amount from OCR response
                const amount = findAmount(response);

                if (amount) {
                    formRef.current.newExpenseAmount.value = amount;
                } else {
                    console.log("No total or subtotal found in OCR response.");
                    // Handle case where no total or subtotal is found
                }
            } catch (error) {
                console.error("Error scanning receipt:", error);
            } finally {
                setIsScanning(false);
                closeModal();
            }
        };

        reader.readAsDataURL(selectedFile);
    };



    return (
        <div className="form-wrapper">
            <h2 className="h3">Add New{" "}
                <span className="accent">
                    {budgets.length === 1 && `${budgets.map((budg) => budg.name)}`}
                </span>{" "}
                Expense
            </h2>
            <fetcher.Form method="post" className="grid-sm" ref={formRef}>
                <div className="expense-inputs">
                    <div className="grid-xs">
                        <label htmlFor="newExpense">Expense Name</label>
                        <input
                            type="text"
                            name="newExpense"
                            id="newExpense"
                            placeholder="e.g., Strawberries, Tomatoes, etc."
                            ref={focusRef}
                            required
                        />
                    </div>
                    <div className="grid-xs">
                        <label htmlFor="newExpenseAmount">Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            name="newExpenseAmount"
                            id="newExpenseAmount"
                            placeholder="e.g., 50.000"
                            required
                        />
                    </div>
                </div>
                <div className="grid-xs" hidden={budgets.length === 1}>
                    <label htmlFor="newExpenseBudget">Budget Category</label>
                    <select name="newExpenseBudget" id="newExpenseBudget" required>
                        {budgets
                            .sort((a, b) => a.createdAt - b.createdAt)
                            .map((budget) => (
                                <option key={budget.id} value={budget.id}>
                                    {budget.name}
                                </option>
                            ))}
                    </select>
                </div>
                <input type="hidden" name="_action" value="createExpense" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button type="submit" className="btn btn--dark" disabled={isSubmitting}>
                        {isSubmitting ? <span>Submitting…</span> : (
                            <>
                                <span>Add Expense</span>
                                <PlusCircleIcon width={20} />
                            </>
                        )}
                    </button>
                    <button type="button" className="btn btn--dark" onClick={openModal} disabled={isScanning}>
                        {isScanning ? <span>Scanning…</span> : (
                            <>
                                <span>Scan your receipt</span>
                                <PlusCircleIcon width={20} />
                            </>
                        )}
                    </button>
                </div>
            </fetcher.Form>
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                contentLabel="Scan Receipt Modal"
                ariaHideApp={false}
            >
                <h2>Upload Receipt</h2>
                <input type="file" accept="image/*" onChange={handleFileChange} />
                <button onClick={handleScanReceipt} disabled={isScanning || !selectedFile}>
                    {isScanning ? "Scanning..." : "Scan"}
                </button>
                <button onClick={closeModal}>Close</button>
            </Modal>
        </div>
    );
};

export default AddExpenseForm;
