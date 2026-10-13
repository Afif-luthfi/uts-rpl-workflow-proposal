package id.ac.demo.workflow;

import java.util.Map;
import org.camunda.bpm.engine.OptimisticLockingException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> status(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", ex.getReason()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> invalid(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", "Periksa isian formulir.", "errors",
            ex.getBindingResult().getFieldErrors().stream().map(e -> e.getField() + ": " + e.getDefaultMessage()).toList()));
    }
    @ExceptionHandler(OptimisticLockingException.class)
    public ResponseEntity<?> concurrent(OptimisticLockingException ex) {
        return ResponseEntity.status(409).body(Map.of("message", "Tugas diubah oleh proses lain. Muat ulang daftar sebelum melanjutkan."));
    }
}
