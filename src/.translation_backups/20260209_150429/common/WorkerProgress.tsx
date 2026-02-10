import { Loader2 } from 'lucide-react';

interface WorkerProgressProps {
  taskName: string;
  progress?: {
    current: number;
    total: number;
    percentage: number;
    message?: string;
  };
  isVisible: boolean;
}

/**
 * WorkerProgress Component
 * 
 * Shows a non-blocking progress indicator for worker tasks.
 * Appears in bottom-right corner while workers are processing.
 */
export function WorkerProgress({ taskName, progress, isVisible }: WorkerProgressProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 border border-gray-200 min-w-[300px]">
      <div className="flex items-start gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-sm text-gray-900">{taskName}</p>
          
          {progress && (
            <>
              {progress.message && (
                <p className="text-xs text-slate-600 mt-1">
                  {progress.message}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 min-w-[45px] text-right">
                  {progress.percentage}%
                </span>
              </div>
              
              <p className="text-xs text-slate-500 mt-1">
                {progress.current} / {progress.total}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Example Usage:
 * 
 * const [backupProgress, setBackupProgress] = useState<any>(null);
 * 
 * const handleBackup = async () => {
 *   setBackupProgress({ current: 0, total: 4, percentage: 0 });
 *   
 *   const backup = await BackupService.createBackup((progress) => {
 *     setBackupProgress(progress);
 *   });
 *   
 *   setBackupProgress(null);
 * };
 * 
 * return (
 *   <>
 *     <button onClick={handleBackup}>Create Backup</button>
 *     <WorkerProgress 
 *       taskName="Creating Backup" 
 *       progress={backupProgress}
 *       isVisible={backupProgress !== null}
 *     />
 *   </>
 * );
 */
