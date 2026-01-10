import { useUIStore } from '@/stores/ui-store';
import { Schedule, TimeTable } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { SettingsPanel } from './SettingsPanel';

interface SettingsModalProps {
    currentSchedule?: Schedule;
    timeTables?: TimeTable[];
    onScheduleUpdate?: (id: string, data: any) => Promise<void>;
    onTimeTablesRefresh?: () => Promise<void>;
    onManageSchedule?: () => void;
}

export function SettingsModal({ currentSchedule, timeTables = [], onScheduleUpdate, onTimeTablesRefresh, onManageSchedule }: SettingsModalProps) {
    const { settingsModalOpen, closeSettingsModal } = useUIStore();

    return (
        <Modal
            isOpen={settingsModalOpen}
            onClose={closeSettingsModal}
            // Use consistent sizing with other large modals, but override to max-w-2xl if needed, 
            // though Modal defaults to max-w-md. We need max-w-2xl for settings.
            className="max-w-2xl max-h-[90vh] p-0 border-none bg-transparent shadow-none"
            hasBackdrop={true}
        >
            {/* 
                SettingsPanel handles its own styling (bg-card, border, etc.) when isModal=true.
                However, Modal wrapper usually provides the card container.
                If we pass className to Modal, it applies to the internal card div.
                SettingsPanel expects to be INSIDE a container if isModal=false, 
                OR it renders the container if isModal=true?
                Let's check SettingsPanel.tsx line 36:
                <div className={`flex flex-col bg-background h-full w-full ${isModal ? 'max-h-[90vh] rounded-2xl shadow-xl ...' : ''}`}>
                
                So SettingsPanel wants to BE the card.
                The shared Modal component ALSO renders a card div:
                <div className={cn("w-full max-w-md bg-card ...", className)}> {children} </div>

                Double card?
                If we use shared Modal, we should probably let Modal be the card, and SettingsPanel just be the content.
                But SettingsPanel combines header and content.
                
                Option A: Pass className="bg-transparent border-none shadow-none p-0 max-w-2xl" to Modal to make it invisible wrapper,
                and let SettingsPanel render the visible card.
            */}
            <SettingsPanel
                currentSchedule={currentSchedule}
                timeTables={timeTables}
                onScheduleUpdate={onScheduleUpdate}
                onTimeTablesRefresh={onTimeTablesRefresh}
                onManageSchedule={onManageSchedule}
                onClose={closeSettingsModal}
                isModal={true}
            />
        </Modal>
    );
}
