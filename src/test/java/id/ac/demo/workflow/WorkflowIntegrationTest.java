package id.ac.demo.workflow;

import com.fasterxml.jackson.databind.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:test;DB_CLOSE_DELAY=-1", "camunda.bpm.generate-unique-process-engine-name=true"})
@AutoConfigureMockMvc
class WorkflowIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    JsonNode submit() throws Exception {
        return parse(mvc.perform(post("/api/proposals").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of(
            "nama", "Mahasiswa DEMO", "nim", "12345678901", "email", "demo@example.com",
            "judul", "Sistem Pengelolaan Dokumen Akademik", "ringkasan", "Penelitian demo untuk pengelolaan dokumen proposal berbasis workflow.",
            "tautan", "https://example.com/proposal-demo.pdf")))).andExpect(status().isCreated()).andReturn());
    }
    JsonNode parse(MvcResult result) throws Exception { return json.readTree(result.getResponse().getContentAsString()); }
    Map<String,String> decision(JsonNode proposal, String value) {
        return new HashMap<>(Map.of("peran", proposal.path("tugas").get(0).path("peran").asText(),
                "keputusan", value, "catatan", "Catatan uji " + value, "pembimbing", "Dosen DEMO"));
    }
    JsonNode complete(JsonNode proposal, String value) throws Exception {
        return send(proposal, decision(proposal, value));
    }
    JsonNode send(JsonNode proposal, Map<String,String> input) throws Exception {
        return parse(mvc.perform(post("/api/tasks/" + proposal.path("tugas").get(0).path("id").asText() + "/complete")
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(input))).andExpect(status().isOk()).andReturn());
    }

    @Test void helloConfirmsActualDeployment() throws Exception {
        mvc.perform(get("/index.html")).andExpect(status().isOk())
            .andExpect(content().string(org.hamcrest.Matchers.containsString("Daftar proposal")));
        mvc.perform(get("/api/hello")).andExpect(status().isOk()).andExpect(jsonPath("$.bpmnDeployed").value(true));
        mvc.perform(get("/api/model")).andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_XML));
    }
    @Test void approvalExecutesJavaServiceAndPreservesHistory() throws Exception {
        JsonNode p = submit();
        assertThat(p.path("tugas").get(0).path("key").asText()).isEqualTo("verifikasi");
        p = complete(p, "SETUJU");
        assertThat(p.path("tugas").get(0).path("key").asText()).isEqualTo("review");
        p = complete(p, "SETUJU");
        assertThat(p.path("tugas").get(0).path("key").asText()).isEqualTo("persetujuan");
        p = complete(p, "SETUJU");
        assertThat(p.path("tugas").size()).isZero();
        assertThat(p.path("data").path("hasil").asText()).isEqualTo("DISETUJUI");
        assertThat(p.path("data").path("notifikasi").asText()).contains("Tidak ada email dikirim");
        assertThat(p.path("riwayat").size()).isEqualTo(3);
        assertThat(p.path("riwayat").get(0).path("catatan").get(0).asText()).contains("SEKPRODI");
        mvc.perform(get("/api/proposals/" + p.path("id").asText() + "/draft"))
            .andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString("Dosen DEMO")));
    }
    @Test void secretaryRevisionIncrementsVersionAndReturnsToVerification() throws Exception {
        reviseFrom(false);
    }
    @Test void lecturerRevisionIncrementsVersionAndReturnsToVerification() throws Exception {
        reviseFrom(true);
    }
    void reviseFrom(boolean fromLecturer) throws Exception {
        JsonNode p = submit(); if (fromLecturer) p = complete(p, "SETUJU");
        p = complete(p, "REVISI");
        assertThat(p.path("tugas").get(0).path("key").asText()).isEqualTo("revisi");
        Map<String,String> input = decision(p, "KIRIM_ULANG");
        input.put("judul", "Judul Proposal Sesudah Revisi"); input.put("ringkasan", "Ringkasan baru dengan metode penelitian yang diperbaiki.");
        input.put("tautan", "https://example.com/revisi-v2.pdf");
        p = send(p, input);
        assertThat(p.path("data").path("versi").asInt()).isEqualTo(2);
        assertThat(p.path("data").path("judul").asText()).isEqualTo(input.get("judul"));
        assertThat(p.path("tugas").get(0).path("key").asText()).isEqualTo("verifikasi");
    }
    @Test void rejectionFromEveryReviewerEndsProcessWithoutDraft() throws Exception {
        for(int level=0;level<3;level++) {
            JsonNode p = submit(); for(int step=0;step<level;step++) p=complete(p,"SETUJU");
            p=complete(p,"TOLAK");
            assertThat(p.path("data").path("hasil").asText()).isEqualTo("DITOLAK");
            assertThat(p.path("tugas").size()).isZero();
            mvc.perform(get("/api/proposals/"+p.path("id").asText()+"/draft")).andExpect(status().isConflict());
        }
    }
    @Test void wrongRoleAndIllegalDecisionCannotAdvanceTask() throws Exception {
        JsonNode p=submit(); String url="/api/tasks/"+p.path("tugas").get(0).path("id").asText()+"/complete";
        var input=decision(p,"SETUJU"); input.put("peran","KAPRODI");
        mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(input))).andExpect(status().isForbidden());
        input.put("peran","SEKPRODI");input.put("keputusan","LOMPATI");
        mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(input))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/proposals/"+p.path("id").asText())).andExpect(jsonPath("$.tugas[0].key").value("verifikasi"));
    }
    @Test void missingSupervisorAndBlankNotesAreRejected() throws Exception {
        JsonNode p=complete(submit(),"SETUJU"); var input=decision(p,"SETUJU"); input.remove("pembimbing");
        String url="/api/tasks/"+p.path("tugas").get(0).path("id").asText()+"/complete";
        mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(input))).andExpect(status().isBadRequest());
        input.put("catatan"," "); input.put("pembimbing","Dosen DEMO");
        mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(input))).andExpect(status().isBadRequest());
    }
    @Test void duplicateCompletionIsConflict() throws Exception {
        JsonNode p=submit(); var input=decision(p,"SETUJU");
        String url="/api/tasks/"+p.path("tugas").get(0).path("id").asText()+"/complete";
        complete(p,"SETUJU");
        mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(input))).andExpect(status().isConflict());
    }
    @Test void invalidInputAndUnknownProposalAreRejected() throws Exception {
        mvc.perform(post("/api/proposals").contentType(MediaType.APPLICATION_JSON).content("{}" )).andExpect(status().isBadRequest());
        mvc.perform(get("/api/proposals/not-found")).andExpect(status().isNotFound());
        var body=Map.of("nama","DEMO","nim","1234567890","email","demo@example.com","judul","Judul Proposal Demo", "ringkasan","Ringkasan proposal demo minimal dua puluh karakter.","tautan","javascript:alert(1)");
        mvc.perform(post("/api/proposals").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
    }
}
