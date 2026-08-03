package com.aksa.capacityplanner.capacity.api;

import com.aksa.capacityplanner.capacity.api.dto.CapacityDashboardDto;
import com.aksa.capacityplanner.capacity.api.dto.StatelessDashboardRequest;
import com.aksa.capacityplanner.capacity.usecase.StatelessCapacityDashboardService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Ilk surum (Part 1) icin: hicbir veri kalici hale getirilmeden, istekte gelen
 * ekip/uye/is kalemi bilgileriyle kapasite dashboard'u anlik hesaplanip donulur.
 * /api/teams/{teamId}/capacity-dashboard (kalici, DB'ye yazilmis veriye dayanan) akisi
 * bundan tamamen bagimsiz olarak, oldugu gibi calismaya devam eder.
 */
@RestController
@RequestMapping("/api/capacity-dashboard")
public class StatelessCapacityDashboardController {

    private final StatelessCapacityDashboardService statelessService;
    private final CapacityDashboardMapper mapper;

    public StatelessCapacityDashboardController(StatelessCapacityDashboardService statelessService,
                                                  CapacityDashboardMapper mapper) {
        this.statelessService = statelessService;
        this.mapper = mapper;
    }

    @PostMapping("/compute")
    public CapacityDashboardDto compute(@Valid @RequestBody StatelessDashboardRequest request) {
        return mapper.toDto(statelessService.compute(request));
    }
}
