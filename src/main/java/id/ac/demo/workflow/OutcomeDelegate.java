package id.ac.demo.workflow;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("outcomeDelegate")
public class OutcomeDelegate implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        boolean approved = "terbitkan".equals(execution.getCurrentActivityId());
        execution.setVariable("hasil", approved ? "DISETUJUI" : "DITOLAK");
        execution.setVariable("notifikasi", "Simulasi notifikasi untuk " + execution.getVariable("email")
                + ": proposal " + (approved ? "disetujui" : "ditolak") + ". Tidak ada email dikirim.");
        if (approved) {
            execution.setVariable("nomorDraft", "DRAFT-" + execution.getProcessBusinessKey());
        }
    }
}
