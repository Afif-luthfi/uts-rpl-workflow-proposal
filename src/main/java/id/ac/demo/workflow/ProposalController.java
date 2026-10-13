package id.ac.demo.workflow;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.net.URI;
import java.util.*;
import org.camunda.bpm.engine.*;
import org.camunda.bpm.engine.history.HistoricProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class ProposalController {
    private final RuntimeService runtime;
    private final TaskService tasks;
    private final HistoryService history;
    private final RepositoryService repository;
    private static final Map<String, String> ROLES = Map.of(
        "verifikasi", "SEKPRODI", "review", "DOSEN", "persetujuan", "KAPRODI", "revisi", "MAHASISWA");

    public ProposalController(RuntimeService runtime, TaskService tasks, HistoryService history,
                              RepositoryService repository) {
        this.runtime = runtime;
        this.tasks = tasks;
        this.history = history;
        this.repository = repository;
    }

    public record Submission(
        @NotBlank @Size(max=100) String nama,
        @NotBlank @Pattern(regexp="[0-9]{8,20}", message="NIM harus 8-20 digit") String nim,
        @NotBlank @Email @Size(max=150) String email,
        @NotBlank @Size(min=10,max=200) String judul,
        @NotBlank @Size(min=20,max=3000) String ringkasan,
        @NotBlank @Size(max=500) String tautan) {}

    public record Decision(@NotBlank String peran, @NotBlank String keputusan,
                           @NotBlank @Size(max=2000) String catatan,
                           @Size(max=100) String pembimbing,
                           @Size(max=200) String judul,
                           @Size(max=3000) String ringkasan,
                           @Size(max=500) String tautan) {}

    @GetMapping("/hello")
    public Map<String, Object> hello() {
        long definitions = repository.createProcessDefinitionQuery().processDefinitionKey("proposal_skripsi").count();
        return Map.of("message", "Hello World dari Spring Boot dan Camunda!", "bpmnDeployed", definitions > 0,
                      "processKey", "proposal_skripsi", "mode", "Demo lokal");
    }

    @PostMapping("/proposals")
    @Transactional
    public ResponseEntity<Map<String,Object>> create(@Valid @RequestBody Submission input) {
        validateLink(input.tautan());
        Map<String,Object> vars = new HashMap<>();
        vars.put("nama", input.nama().trim()); vars.put("nim", input.nim());
        vars.put("email", input.email()); vars.put("judul", input.judul().trim());
        vars.put("ringkasan", input.ringkasan().trim()); vars.put("tautan", input.tautan().trim());
        vars.put("versi", 1); vars.put("hasil", "DIPROSES");
        var instance = runtime.startProcessInstanceByKey("proposal_skripsi", "PS-" + UUID.randomUUID().toString().substring(0,8).toUpperCase(), vars);
        return ResponseEntity.created(URI.create("/api/proposals/" + instance.getId())).body(detail(instance.getId()));
    }

    @GetMapping("/proposals")
    public List<Map<String,Object>> list() {
        return history.createHistoricProcessInstanceQuery().processDefinitionKey("proposal_skripsi")
            .orderByProcessInstanceStartTime().desc().list().stream().map(p -> summarize(p)).toList();
    }

    private Map<String,Object> summarize(HistoricProcessInstance process) {
        Map<String,Object> result = new LinkedHashMap<>();
        result.put("id", process.getId()); result.put("nomor", process.getBusinessKey());
        result.put("mulai", process.getStartTime()); result.put("selesai", process.getEndTime());
        Map<String,Object> variables = new HashMap<>();
        history.createHistoricVariableInstanceQuery().processInstanceId(process.getId()).list()
            .forEach(v -> variables.put(v.getName(), v.getValue()));
        result.put("data", variables);
        List<Map<String,String>> active = tasks.createTaskQuery().processInstanceId(process.getId()).list().stream()
            .map(t -> Map.of("id", t.getId(), "nama", t.getName(), "key", t.getTaskDefinitionKey(),
                            "peran", ROLES.get(t.getTaskDefinitionKey()))).toList();
        result.put("tugas", active);
        result.put("status", active.isEmpty() ? variables.getOrDefault("hasil", "SELESAI") : active.get(0).get("nama"));
        return result;
    }

    @GetMapping("/proposals/{id}")
    public Map<String,Object> detail(@PathVariable String id) {
        var process = history.createHistoricProcessInstanceQuery().processInstanceId(id).singleResult();
        if (process == null || !process.getProcessDefinitionId().startsWith("proposal_skripsi:")) {
            throw error(HttpStatus.NOT_FOUND, "Proposal tidak ditemukan.");
        }
        var result = summarize(process);
        result.put("riwayat", history.createHistoricTaskInstanceQuery().processInstanceId(id)
            .orderByHistoricActivityInstanceStartTime().asc().list().stream().map(t -> {
                Map<String,Object> entry = new LinkedHashMap<>();
                entry.put("nama", t.getName()); entry.put("mulai", t.getStartTime()); entry.put("selesai", t.getEndTime());
                entry.put("catatan", tasks.getTaskComments(t.getId()).stream().map(c -> c.getFullMessage()).toList());
                return entry;
            }).toList());
        return result;
    }

    @PostMapping("/tasks/{id}/complete")
    @Transactional
    public Map<String,Object> complete(@PathVariable String id, @Valid @RequestBody Decision input) {
        Task task = tasks.createTaskQuery().taskId(id).singleResult();
        if (task == null) throw error(HttpStatus.CONFLICT, "Tugas sudah selesai atau tidak ditemukan. Muat ulang daftar.");
        String key = task.getTaskDefinitionKey();
        if (!Objects.equals(ROLES.get(key), input.peran())) throw error(HttpStatus.FORBIDDEN, "Peran demo tidak sesuai dengan tugas.");
        Set<String> allowed = switch(key) {
            case "revisi" -> Set.of("KIRIM_ULANG");
            case "persetujuan" -> Set.of("SETUJU", "TOLAK");
            default -> Set.of("SETUJU", "REVISI", "TOLAK");
        };
        if (!allowed.contains(input.keputusan())) throw error(HttpStatus.BAD_REQUEST, "Keputusan tidak tersedia pada tahap ini.");
        Map<String,Object> variables = new HashMap<>();
        if ("revisi".equals(key)) {
            if (input.judul() == null || input.judul().trim().length() < 10 || input.ringkasan() == null || input.ringkasan().trim().length() < 20) {
                throw error(HttpStatus.BAD_REQUEST, "Revisi wajib berisi judul minimal 10 karakter dan ringkasan minimal 20 karakter.");
            }
            validateLink(input.tautan());
            variables.put("judul", input.judul().trim()); variables.put("ringkasan", input.ringkasan().trim());
            variables.put("tautan", input.tautan().trim());
            variables.put("versi", ((Number)tasks.getVariable(id, "versi")).intValue() + 1);
        } else {
            variables.put("keputusan", input.keputusan());
        }
        if ("review".equals(key) && "SETUJU".equals(input.keputusan())) {
            if (input.pembimbing() == null || input.pembimbing().isBlank()) throw error(HttpStatus.BAD_REQUEST, "Nama calon pembimbing wajib diisi.");
            variables.put("pembimbing", input.pembimbing().trim());
        }
        tasks.addComment(id, task.getProcessInstanceId(), input.peran() + " | " + input.keputusan() + " | " + input.catatan().trim());
        tasks.complete(id, variables);
        return detail(task.getProcessInstanceId());
    }

    @GetMapping(value="/proposals/{id}/draft", produces="text/plain;charset=UTF-8")
    public String draft(@PathVariable String id) {
        var detail = detail(id);
        @SuppressWarnings("unchecked") var data = (Map<String,Object>)detail.get("data");
        if (!"DISETUJUI".equals(data.get("hasil"))) throw error(HttpStatus.CONFLICT, "Draf tersedia setelah persetujuan ketua prodi.");
        return "DRAF DATA PEMBIMBINGAN SKRIPSI\nBukan surat resmi / data demonstrasi\n\nNomor: " + data.get("nomorDraft")
            + "\nMahasiswa: " + data.get("nama") + "\nNIM: " + data.get("nim") + "\nJudul: " + data.get("judul")
            + "\nPembimbing: " + data.get("pembimbing") + "\nVersi proposal: " + data.get("versi")
            + "\nStatus: disetujui ketua prodi pada alur demo.\n";
    }

    @GetMapping(value="/model", produces="application/xml")
    public byte[] model() throws java.io.IOException {
        try (var stream = getClass().getResourceAsStream("/processes/proposal.bpmn")) {
            return Objects.requireNonNull(stream).readAllBytes();
        }
    }

    private void validateLink(String value) {
        try {
            URI uri = URI.create(value == null ? "" : value.trim());
            if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) || uri.getHost() == null) throw new IllegalArgumentException();
        } catch (IllegalArgumentException ex) { throw error(HttpStatus.BAD_REQUEST, "Tautan dokumen harus berupa URL http/https yang valid."); }
    }

    private ResponseStatusException error(HttpStatus status, String message) { return new ResponseStatusException(status, message); }
}
